import { BadRequestException, Controller, Get, Param, Post, Req, StreamableFile, UploadedFile, UseGuards, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DocumentProcessingService } from './document-processing.service';
import { AuthContext } from '../auth/auth-context';

@ApiTags('documents') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Controller('applications/:id/documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentProcessingService) {}

  @Post() @Roles(Role.ADMIN, Role.LOAN_OFFICER, Role.UNDERWRITER, Role.UNDERWRITING_MANAGER, Role.READ_ONLY) @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  upload(@Param('id') applicationId: string, @UploadedFile() file: any, @Body('type') type: string, @Req() req: any) {
    if (!file) throw new BadRequestException('A document file is required');
    return this.documents.upload({ applicationId, type: type || 'OTHER', fileName: file.originalname, mimeType: file.mimetype, buffer: file.buffer, userId: req.user.id, context: req.user as AuthContext });
  }

  @Get(':documentId/download') @Roles(Role.ADMIN, Role.LOAN_OFFICER, Role.UNDERWRITER, Role.UNDERWRITING_MANAGER, Role.AUDITOR, Role.READ_ONLY)
  async download(@Param('id') applicationId: string, @Param('documentId') documentId: string, @Req() req: { user: AuthContext }) {
    const file = await this.documents.download(applicationId, documentId, req.user as AuthContext);
    const safeFileName = file.fileName.replace(/[\r\n"\\]/g, '_');
    return new StreamableFile(file.buffer, { type: file.contentType, disposition: `attachment; filename="${safeFileName}"` });
  }
}
