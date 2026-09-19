import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationWorkflowService } from './application-workflow.service';
@Module({ controllers: [ApplicationsController], providers: [ApplicationsService, ApplicationWorkflowService], exports: [ApplicationsService, ApplicationWorkflowService] }) export class ApplicationsModule {}
