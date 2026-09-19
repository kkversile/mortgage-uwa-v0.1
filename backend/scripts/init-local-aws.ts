import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/prisma/prisma.service';
import { DocumentProcessingService } from '../src/modules/documents/document-processing.service';

async function main() {
  console.log('Starting local AWS resource initialization');
  const resources = await new DocumentProcessingService(new PrismaService(), new ConfigService()).ensureResources();
  console.log(JSON.stringify(resources, null, 2));
}
main().catch(error => { process.stdout.write(`LOCAL_AWS_INIT_ERROR ${JSON.stringify({ name: error?.name, message: error?.message, stack: error?.stack })}`); process.exitCode = 1; });
