import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/prisma/prisma.service';
import { DocumentProcessingService } from '../src/modules/documents/document-processing.service';

async function main() {
  await new DocumentProcessingService(new PrismaService(), new ConfigService()).runWorker();
}
main().catch(error => { console.error(error); process.exitCode = 1; });
