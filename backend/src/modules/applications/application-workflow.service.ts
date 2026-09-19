import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthContext, canAccessAllTenants } from '../auth/auth-context';

const transitions: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  APPLICATION_STARTED: [ApplicationStatus.APPLICATION_SUBMITTED, ApplicationStatus.INCOMPLETE, ApplicationStatus.WITHDRAWN],
  APPLICATION_SUBMITTED: [ApplicationStatus.DISCLOSURES_PENDING, ApplicationStatus.PROCESSING],
  DISCLOSURES_PENDING: [ApplicationStatus.INTENT_TO_PROCEED, ApplicationStatus.INCOMPLETE],
  INTENT_TO_PROCEED: [ApplicationStatus.PROCESSING],
  PROCESSING: [ApplicationStatus.DOCUMENTS_PENDING, ApplicationStatus.DOCUMENT_PROCESSING, ApplicationStatus.VERIFICATIONS_PENDING],
  DOCUMENTS_PENDING: [ApplicationStatus.DOCUMENT_PROCESSING, ApplicationStatus.VERIFICATIONS_PENDING],
  DOCUMENT_PROCESSING: [ApplicationStatus.VERIFICATIONS_PENDING, ApplicationStatus.READY_FOR_UNDERWRITING],
  VERIFICATIONS_PENDING: [ApplicationStatus.READY_FOR_UNDERWRITING],
  READY_FOR_UNDERWRITING: [ApplicationStatus.UNDERWRITING],
  UNDERWRITING_READY: [ApplicationStatus.UNDERWRITING],
  UNDERWRITING: [ApplicationStatus.CONDITIONAL_APPROVAL, ApplicationStatus.FINAL_APPROVAL, ApplicationStatus.DENIED, ApplicationStatus.CONDITIONS_PENDING],
  UNDER_REVIEW: [ApplicationStatus.CONDITIONAL_APPROVAL, ApplicationStatus.FINAL_APPROVAL, ApplicationStatus.DENIED, ApplicationStatus.CONDITIONS_PENDING],
  MANUAL_REVIEW: [ApplicationStatus.CONDITIONAL_APPROVAL, ApplicationStatus.FINAL_APPROVAL, ApplicationStatus.DENIED, ApplicationStatus.CONDITIONS_PENDING],
  CONDITIONAL_APPROVAL: [ApplicationStatus.CONDITIONS_PENDING],
  CONDITIONS_PENDING: [ApplicationStatus.CONDITIONS_REVIEW],
  CONDITIONS_REVIEW: [ApplicationStatus.CONDITIONS_PENDING, ApplicationStatus.FINAL_APPROVAL],
  FINAL_APPROVAL: [ApplicationStatus.CLEAR_TO_CLOSE],
  CLEAR_TO_CLOSE: [ApplicationStatus.CLOSING],
  CLOSING: [ApplicationStatus.FUNDED],
  FUNDED: [ApplicationStatus.POST_CLOSING],
  POST_CLOSING: [ApplicationStatus.COMPLETED],
};

@Injectable()
export class ApplicationWorkflowService {
  constructor(private readonly prisma: PrismaService) {}
  async transition(applicationId: string, targetStatus: ApplicationStatus, context: AuthContext) {
    const where = canAccessAllTenants(context) ? { id: applicationId } : { id: applicationId, tenantId: context.tenantId, ...(context.accountType === 'CONSUMER' ? { consumerUserId: context.userId } : {}) };
    const app = await this.prisma.mortgageApplication.findFirst({ where, select: { id: true, status: true, tenantId: true } });
    if (!app) throw new NotFoundException('Application not found');
    if (!(transitions[app.status] ?? []).includes(targetStatus)) throw new BadRequestException(`Invalid application transition: ${app.status} -> ${targetStatus}`);
    if (targetStatus === ApplicationStatus.CLEAR_TO_CLOSE) {
      const openConditions = await this.prisma.underwritingCondition.count({ where: { applicationId: app.id, required: true, status: { notIn: ['SATISFIED', 'WAIVED'] } } });
      if (openConditions > 0) throw new BadRequestException('Clear to close requires all required conditions to be satisfied');
    }
    const updated = await this.prisma.$transaction(async tx => {
      const result = await tx.mortgageApplication.update({ where: { id: app.id }, data: { status: targetStatus, submittedAt: targetStatus === ApplicationStatus.APPLICATION_SUBMITTED ? new Date() : undefined } });
      await tx.auditEvent.create({ data: { applicationId: app.id, userId: context.userId, action: 'APPLICATION_STATUS_CHANGED', entityType: 'MortgageApplication', entityId: app.id, details: { from: app.status, to: targetStatus, tenantId: app.tenantId } } });
      return result;
    });
    return updated;
  }
}
