import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Client, CreateBucketCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, CreateQueueCommand, GetQueueAttributesCommand, GetQueueUrlCommand, ReceiveMessageCommand, DeleteMessageCommand, SendMessageCommand } from '@aws-sdk/client-sqs';
import { randomUUID } from 'crypto';
import { PDFParse } from 'pdf-parse';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, readdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { AuthContext, canAccessAllTenants } from '../auth/auth-context';

const execFileAsync = promisify(execFile);

export interface DocumentUploadedEvent {
  eventType: 'DOCUMENT_UPLOADED';
  eventVersion: '1.0' | '2.0';
  applicationId: string;
  documentId: string;
  documentType: string;
  bucket: string;
  objectKey: string;
  processingVersion: string;
  tenantId?: string;
  userId?: string;
}

interface UploadInput { applicationId: string; type: string; fileName: string; mimeType: string; buffer: Buffer; userId: string; context: AuthContext; }

export interface DocumentExtractionProvider {
  extract(input: { documentType: string; fileName: string; mimeType: string; buffer: Buffer }): Promise<Record<string, unknown>>;
}

/** Deterministic synthetic provider. It is deliberately labelled as mock data. */
export class MockDocumentExtractionProvider implements DocumentExtractionProvider {
  async extract(input: { documentType: string; fileName: string; mimeType: string; buffer: Buffer }) {
    const fields: Record<string, unknown> = input.documentType === 'PAYSLIP'
      ? { employer: 'Synthetic Technologies', employee: 'Demo Applicant', grossPay: 8000, payPeriod: '2026-08' }
      : input.documentType === 'BANK_STATEMENT'
        ? { institution: 'Synthetic Demo Bank', endingBalance: 85000, statementPeriod: '2026-08' }
        : { documentType: input.documentType, synthetic: true };
    return { provider: 'mock', deterministic: true, sourceFileName: input.fileName, fields };
  }
}

export class PdfTextExtractionProvider implements DocumentExtractionProvider {
  async extract(input: { documentType: string; fileName: string; mimeType: string; buffer: Buffer }) {
    const parser = new PDFParse({ data: input.buffer });
    try {
      const parsed = await parser.getText();
      const text = parsed.text.replace(/\u0000/g, '').replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '').trim();
      if (!text || !/[a-z0-9]{3,}/i.test(text)) throw new Error('PDF text extraction returned no text; scanned PDFs require OCR');
      const fields = extractDocumentFields(text, input.documentType);
      return { provider: 'pdf-parse', deterministic: true, sourceFileName: input.fileName, pageCount: parsed.total, text, fields };
    } finally {
      await parser.destroy();
    }
  }
}

export class LocalOcrExtractionProvider implements DocumentExtractionProvider {
  constructor(private readonly tesseractPath: string, private readonly pdftoppmPath: string) {}

  async extract(input: { documentType: string; fileName: string; mimeType: string; buffer: Buffer }) {
    const workDir = await mkdtemp(join(require('os').tmpdir(), 'mortgage-uwa-ocr-'));
    try {
      const sourcePath = join(workDir, input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_'));
      await writeFile(sourcePath, input.buffer);
      const imagePaths = input.fileName.toLowerCase().endsWith('.pdf')
        ? await this.renderPdf(sourcePath, workDir)
        : [sourcePath];
      const pageTexts: string[] = [];
      for (const imagePath of imagePaths) {
        const result = await execFileAsync(this.tesseractPath, [imagePath, 'stdout', '--psm', '6', '-l', 'eng'], { maxBuffer: 20 * 1024 * 1024 });
        pageTexts.push(result.stdout.trim());
      }
      const text = pageTexts.filter(Boolean).join('\n\n').trim();
      if (!text) throw new Error('Tesseract OCR returned no text');
      return { provider: 'tesseract', deterministic: true, sourceFileName: input.fileName, pageCount: imagePaths.length, text, fields: extractDocumentFields(text, input.documentType) };
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  private async renderPdf(sourcePath: string, workDir: string) {
    const prefix = join(workDir, 'page');
    await execFileAsync(this.pdftoppmPath, ['-png', '-r', '200', sourcePath, prefix], { maxBuffer: 5 * 1024 * 1024 });
    const names = (await readdir(workDir)).filter(name => /^page-\d+\.png$/i.test(name)).sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]));
    if (!names.length) throw new Error('PDF could not be rendered for OCR');
    return names.map(name => join(workDir, name));
  }
}

function extractDocumentFields(text: string, documentType: string) {
  const normalized = text.replace(/\s+/g, ' ');
  const fields: Record<string, unknown> = {};
  const score = firstNumber(normalized, [
    /\b(?:FICO|Vantage|Credit)\b[^0-9]{0,20}(\d{3})\b/i,
    /\bScore\b[^0-9]{0,10}(\d{3})\b/i,
  ]);
  if (score !== undefined && score >= 300 && score <= 850) fields.creditScore = score;
  const grossPay = firstMoney(normalized, /Gross\s+(?:Pay|Income)\s*[:#-]?\s*\$?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (grossPay !== undefined) fields.grossPay = grossPay;
  const endingBalance = firstMoney(normalized, /(?:Ending|Closing)\s+Balance\s*[:#-]?\s*\$?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (endingBalance !== undefined) fields.endingBalance = endingBalance;
  const lineValue = (label: string) => text.split(/\r?\n/).map(line => line.trim()).find(line => new RegExp(`^${label}\\s+`, 'i').test(line))?.replace(new RegExp(`^${label}\\s*[:#-]?\\s*`, 'i'), '').trim();
  const employer = lineValue('Employer');
  if (employer) fields.employer = employer;
  const employee = lineValue('Employee');
  if (employee) fields.employee = employee;
  fields.documentType = documentType;
  return fields;
}

function firstNumber(value: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return Number(match[1]);
  }
  return undefined;
}

function firstMoney(value: string, pattern: RegExp) {
  const match = value.match(pattern);
  return match ? Number(match[1].replace(/,/g, '')) : undefined;
}

@Injectable()
export class DocumentProcessingService {
  private readonly bucket: string;
  private readonly queueName: string;
  private readonly dlqName: string;
  private readonly processingVersion = '2.0';
  private queueUrl?: string;
  private readonly s3: S3Client;
  private readonly sqs: SQSClient;
  private readonly pdfExtractor: DocumentExtractionProvider;
  private readonly ocrExtractor: DocumentExtractionProvider;

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('AWS_ENDPOINT_URL');
    const clientOptions = {
      region: this.config.get<string>('AWS_REGION', 'us-east-1'),
      ...(endpoint ? { endpoint, credentials: { accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID', 'test'), secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY', 'test') } } : {}),
    };
    this.s3 = new S3Client({ ...clientOptions, ...(endpoint ? { forcePathStyle: true } : {}) });
    this.sqs = new SQSClient(clientOptions);
    this.bucket = this.config.get<string>('S3_BUCKET', 'mortgage-uwa-documents-local');
    this.queueName = this.config.get<string>('SQS_QUEUE_NAME', 'mortgage-document-processing-local');
    this.dlqName = this.config.get<string>('SQS_DLQ_NAME', 'mortgage-document-processing-dlq-local');
    this.pdfExtractor = new PdfTextExtractionProvider();
    this.ocrExtractor = new LocalOcrExtractionProvider(
      this.config.get<string>('TESSERACT_PATH', process.platform === 'win32' ? 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe' : 'tesseract'),
      this.config.get<string>('PDFTOPPM_PATH', 'pdftoppm'),
    );
  }

  async ensureResources() {
    try { await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket })); } catch (error) {
      if (!this.isAlreadyExists(error)) throw error;
    }
    const dlq = await this.sqs.send(new CreateQueueCommand({ QueueName: this.dlqName }));
    const dlqAttributes = await this.sqs.send(new GetQueueAttributesCommand({ QueueUrl: dlq.QueueUrl, AttributeNames: ['QueueArn'] }));
    const redrivePolicy = JSON.stringify({ deadLetterTargetArn: dlqAttributes.Attributes?.QueueArn, maxReceiveCount: '3' });
    const queue = await this.sqs.send(new CreateQueueCommand({ QueueName: this.queueName, Attributes: { RedrivePolicy: redrivePolicy, VisibilityTimeout: '30' } }));
    this.queueUrl = queue.QueueUrl ?? (await this.sqs.send(new GetQueueUrlCommand({ QueueName: this.queueName }))).QueueUrl;
    if (!this.queueUrl) throw new Error('Unable to resolve document processing queue URL');
    return { bucket: this.bucket, queueUrl: this.queueUrl, dlq: this.dlqName };
  }

  async upload(input: UploadInput) {
    const allowed = new Set(['application/pdf', 'image/jpeg', 'image/png']);
    const maxBytes = Number(this.config.get('DOCUMENT_MAX_BYTES', 10 * 1024 * 1024));
    if (!allowed.has(input.mimeType)) throw new BadRequestException('Only PDF, JPG/JPEG and PNG documents are supported');
    if (!input.buffer?.length || input.buffer.length > maxBytes) throw new BadRequestException(`Document must be between 1 byte and ${maxBytes} bytes`);
    if (!this.hasSupportedSignature(input.mimeType, input.buffer)) throw new BadRequestException('Document content does not match its declared type');
    const accessWhere = canAccessAllTenants(input.context) ? { id: input.applicationId } : input.context.accountType === 'CONSUMER' ? { id: input.applicationId, tenantId: input.context.tenantId, consumerUserId: input.context.userId } : { id: input.applicationId, tenantId: input.context.tenantId };
    const app = await this.prisma.mortgageApplication.findFirst({ where: accessWhere, select: { id: true, applicationNumber: true, tenantId: true } });
    if (!app) throw new NotFoundException('Application not found');
    if (!app.tenantId) throw new BadRequestException('Application is not assigned to a lender workspace');
    await this.ensureResources();
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `tenants/${app.tenantId}/applications/${app.applicationNumber}/${randomUUID()}-${safeName}`;
    await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: storageKey, Body: input.buffer, ContentType: input.mimeType, ServerSideEncryption: 'AES256' }));
    const document = await this.prisma.$transaction(async tx => {
      const created = await tx.document.create({ data: { applicationId: app.id, type: input.type || 'OTHER', fileName: input.fileName, status: DocumentStatus.QUEUED, storageKey, processingVersion: this.processingVersion } });
      const event: DocumentUploadedEvent = { eventType: 'DOCUMENT_UPLOADED', eventVersion: '2.0', tenantId: app.tenantId!, applicationId: app.id, documentId: created.id, documentType: created.type, bucket: this.bucket, objectKey: storageKey, processingVersion: '2.0', userId: input.userId };
      await this.sqs.send(new SendMessageCommand({ QueueUrl: this.queueUrl, MessageBody: JSON.stringify(event), MessageAttributes: { eventType: { DataType: 'String', StringValue: event.eventType }, eventVersion: { DataType: 'String', StringValue: event.eventVersion } } }));
      await tx.mortgageApplication.update({ where: { id: app.id }, data: { status: 'DOCUMENT_PROCESSING' } });
      await tx.auditEvent.create({ data: { applicationId: app.id, userId: input.userId, action: 'DOCUMENT_UPLOADED', entityType: 'Document', entityId: created.id, details: { storage: 's3', bucket: this.bucket, objectKey: storageKey, eventVersion: event.eventVersion, tenantId: app.tenantId } } });
      return created;
    });
    return document;
  }

  async download(applicationId: string, documentId: string, context: AuthContext) {
    const accessWhere = canAccessAllTenants(context) ? { id: applicationId } : context.accountType === 'CONSUMER' ? { id: applicationId, tenantId: context.tenantId, consumerUserId: context.userId } : { id: applicationId, tenantId: context.tenantId };
    const application = await this.prisma.mortgageApplication.findFirst({ where: accessWhere, select: { id: true } });
    if (!application) throw new NotFoundException('Document not found');
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, applicationId },
      select: { fileName: true, storageKey: true },
    });
    if (!document?.storageKey) throw new NotFoundException('Document not found');
    const buffer = await this.downloadObject(this.bucket, document.storageKey);
    return { fileName: document.fileName, buffer, contentType: this.contentTypeFor(document.fileName) };
  }

  async processMessage(body: string) {
    const event = this.parseEvent(body);
    const document = await this.prisma.document.findUnique({ where: { id: event.documentId }, include: { application: { select: { tenantId: true } } } });
    if (!document) throw new NotFoundException('Document in event not found');
    if (event.tenantId && document.application.tenantId !== event.tenantId) throw new BadRequestException('Document event tenant does not match application tenant');
    if (document.applicationId !== event.applicationId) throw new BadRequestException('Document event application does not match document');
    if (document.processingVersion === event.processingVersion && document.processedAt && document.extractedJson) return { skipped: true, documentId: document.id };
    await this.prisma.document.update({ where: { id: document.id }, data: { status: DocumentStatus.PROCESSING, processingError: null } });
    try {
      const buffer = await this.downloadObject(event.bucket, event.objectKey);
      const isPdf = document.fileName.toLowerCase().endsWith('.pdf');
      let extracted: Record<string, unknown>;
      if (isPdf) {
        try {
          extracted = await this.pdfExtractor.extract({ documentType: event.documentType, fileName: document.fileName, mimeType: 'application/pdf', buffer });
        } catch (error) {
          console.warn(`PDF text layer unavailable for ${document.fileName}; falling back to Tesseract OCR`, error instanceof Error ? error.message : error);
          extracted = await this.ocrExtractor.extract({ documentType: event.documentType, fileName: document.fileName, mimeType: 'application/pdf', buffer });
        }
      } else {
        extracted = await this.ocrExtractor.extract({ documentType: event.documentType, fileName: document.fileName, mimeType: 'image/*', buffer });
      }
      const provider = String(extracted.provider ?? 'unknown');
      const verification = { status: 'VERIFIED', provider, verifiedAt: new Date().toISOString(), checks: provider === 'pdf-parse' ? ['file-readable', 'pdf-text-extracted', 'document-type-supported'] : ['file-readable', 'ocr-text-extracted', 'document-type-supported'] };
      const result = await this.prisma.$transaction(async tx => {
        const updated = await tx.document.update({ where: { id: document.id }, data: { status: DocumentStatus.VERIFIED, extractedJson: extracted as any, verificationJson: verification, processedAt: new Date(), processingError: null } });
        const creditScore = Number((extracted.fields as Record<string, unknown>)?.creditScore);
        if (document.type === 'CREDIT_REPORT' && Number.isInteger(creditScore) && creditScore >= 300 && creditScore <= 850) {
          const existing = await tx.creditReport.findFirst({ where: { applicationId: event.applicationId }, orderBy: { retrievedAt: 'desc' } });
          const riskBand = creditScore >= 740 ? 'VERY_GOOD' : creditScore >= 700 ? 'GOOD' : creditScore >= 650 ? 'FAIR' : 'WEAK';
          if (existing) await tx.creditReport.update({ where: { id: existing.id }, data: { creditScore, riskBand, provider: 'PDF_TEXT' } });
          else await tx.creditReport.create({ data: { applicationId: event.applicationId, creditScore, riskBand, provider: 'PDF_TEXT', utilizationPct: 0, outstandingDebt: 0 } });
        }
        const pending = await tx.document.count({ where: { applicationId: event.applicationId, status: { not: DocumentStatus.VERIFIED } } });
        if (pending === 0) await tx.mortgageApplication.update({ where: { id: event.applicationId }, data: { status: 'UNDERWRITING_READY' } });
        await tx.auditEvent.create({ data: { applicationId: event.applicationId, userId: event.userId, action: 'DOCUMENT_PROCESSED', entityType: 'Document', entityId: document.id, details: { provider, eventVersion: event.eventVersion, extractedFields: Object.keys((extracted as any).fields ?? {}) } } });
        return updated;
      });
      return { skipped: false, document: result };
    } catch (error) {
      await this.prisma.document.update({ where: { id: document.id }, data: { status: DocumentStatus.FAILED, processingError: error instanceof Error ? error.message : 'Document processing failed' } });
      throw error;
    }
  }

  async processOneBatch() {
    await this.ensureResources();
    const messages = await this.sqs.send(new ReceiveMessageCommand({ QueueUrl: this.queueUrl, MaxNumberOfMessages: 5, WaitTimeSeconds: 2, VisibilityTimeout: 30 }));
    let processed = 0;
    for (const message of messages.Messages ?? []) {
      try {
        if (message.Body) await this.processMessage(message.Body);
        if (message.ReceiptHandle) await this.sqs.send(new DeleteMessageCommand({ QueueUrl: this.queueUrl, ReceiptHandle: message.ReceiptHandle }));
        processed++;
      } catch (error) {
        if (error instanceof NotFoundException || error instanceof BadRequestException) {
          if (message.ReceiptHandle) await this.sqs.send(new DeleteMessageCommand({ QueueUrl: this.queueUrl, ReceiptHandle: message.ReceiptHandle }));
          console.warn('Discarded permanent document message failure', error.message);
          processed++;
        } else {
          console.error('Document message failed; leaving it for retry/DLQ', error);
        }
      }
    }
    return { received: messages.Messages?.length ?? 0, processed };
  }

  async runWorker() {
    await this.ensureResources();
    await this.requeueStaleQueuedDocuments();
    console.log(`Document worker listening on ${this.queueName}; extraction providers=pdf-parse+tesseract`);
    while (true) await this.processOneBatch();
  }

  private async requeueStaleQueuedDocuments() {
    const cutoff = new Date(Date.now() - 60_000);
    const queued = await this.prisma.document.findMany({
      where: { status: DocumentStatus.QUEUED, storageKey: { not: null }, updatedAt: { lt: cutoff } },
      select: { id: true, applicationId: true, type: true, storageKey: true, processingVersion: true, application: { select: { tenantId: true } } },
      take: 100,
    });
    for (const document of queued) {
      await this.sqs.send(new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify({
          eventType: 'DOCUMENT_UPLOADED',
          eventVersion: '2.0',
          tenantId: document.application.tenantId ?? undefined,
          applicationId: document.applicationId,
          documentId: document.id,
          documentType: document.type,
          bucket: this.bucket,
          objectKey: document.storageKey!,
          processingVersion: document.processingVersion,
        } satisfies DocumentUploadedEvent),
      }));
    }
    if (queued.length) console.log(`Requeued ${queued.length} stale document(s) for processing recovery`);
  }

  private parseEvent(body: string): DocumentUploadedEvent {
    let event: Partial<DocumentUploadedEvent>;
    try { event = JSON.parse(body); } catch { throw new BadRequestException('Invalid document event JSON'); }
    if (event.eventType !== 'DOCUMENT_UPLOADED' || !['1.0', '2.0'].includes(event.eventVersion as string) || !event.applicationId || !event.documentId || !event.objectKey) throw new BadRequestException('Invalid DOCUMENT_UPLOADED event contract');
    return event as DocumentUploadedEvent;
  }

  private async downloadObject(bucket: string, key: string) {
    const response = await this.s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!response.Body) throw new Error('Stored document has no readable body');
    if ('transformToByteArray' in response.Body && typeof response.Body.transformToByteArray === 'function') return Buffer.from(await response.Body.transformToByteArray());
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as AsyncIterable<Buffer | Uint8Array | string>) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return Buffer.concat(chunks);
  }

  private isAlreadyExists(error: unknown) { return ['BucketAlreadyOwnedByYou', 'BucketAlreadyExists', 'QueueAlreadyExists'].includes(String((error as { name?: string })?.name)); }
  private contentTypeFor(fileName: string) {
    const extension = fileName.toLowerCase().split('.').pop();
    return extension === 'pdf' ? 'application/pdf' : extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : 'image/png';
  }
  private hasSupportedSignature(mimeType: string, buffer: Buffer) {
    if (mimeType === 'application/pdf') return buffer.subarray(0, 5).toString() === '%PDF-';
    if (mimeType === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (mimeType === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    return false;
  }
}
