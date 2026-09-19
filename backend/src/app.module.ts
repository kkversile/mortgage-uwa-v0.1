import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { UnderwritingModule } from './modules/underwriting/underwriting.module';
import { RulesModule } from './modules/rules/rules.module';
import { HealthController } from './health.controller';
import { DocumentsModule } from './modules/documents/documents.module';
import { AdminModule } from './modules/admin/admin.module';
import { CreditModule } from './modules/credit/credit.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ConditionsModule } from './modules/conditions/conditions.module';
import { AusModule } from './modules/aus/aus.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DashboardModule,
    ApplicationsModule,
    UnderwritingModule,
    RulesModule,
    DocumentsModule,
    AdminModule,
    CreditModule,
    TasksModule,
    ConditionsModule,
    AusModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
