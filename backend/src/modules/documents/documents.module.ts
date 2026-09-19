import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentProcessingService } from './document-processing.service';

@Module({ controllers: [DocumentsController], providers: [DocumentProcessingService], exports: [DocumentProcessingService] })
export class DocumentsModule {}
