CREATE TABLE `LoanTask` (
  `id` VARCHAR(191) NOT NULL,
  `tenantId` VARCHAR(191) NOT NULL,
  `applicationId` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NOT NULL,
  `assignedToId` VARCHAR(191) NULL,
  `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
  `status` ENUM('OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
  `dueAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` DATETIME(3) NULL,
  INDEX `LoanTask_tenantId_status_idx`(`tenantId`(64), `status`),
  INDEX `LoanTask_applicationId_status_idx`(`applicationId`(64), `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UnderwritingCondition` (
  `id` VARCHAR(191) NOT NULL,
  `tenantId` VARCHAR(191) NOT NULL,
  `applicationId` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NOT NULL,
  `required` BOOLEAN NOT NULL DEFAULT true,
  `status` ENUM('OPEN', 'DOCUMENT_RECEIVED', 'PROCESSOR_REVIEW', 'UNDERWRITER_REVIEW', 'SATISFIED', 'WAIVED') NOT NULL DEFAULT 'OPEN',
  `createdById` VARCHAR(191) NULL,
  `satisfiedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `UnderwritingCondition_tenantId_status_idx`(`tenantId`(64), `status`),
  INDEX `UnderwritingCondition_applicationId_status_idx`(`applicationId`(64), `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ConditionHistory` (
  `id` VARCHAR(191) NOT NULL,
  `conditionId` VARCHAR(191) NOT NULL,
  `fromStatus` ENUM('OPEN', 'DOCUMENT_RECEIVED', 'PROCESSOR_REVIEW', 'UNDERWRITER_REVIEW', 'SATISFIED', 'WAIVED') NULL,
  `toStatus` ENUM('OPEN', 'DOCUMENT_RECEIVED', 'PROCESSOR_REVIEW', 'UNDERWRITER_REVIEW', 'SATISFIED', 'WAIVED') NOT NULL,
  `changedById` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ConditionHistory_conditionId_createdAt_idx`(`conditionId`(64), `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AusSubmission` (
  `id` VARCHAR(191) NOT NULL,
  `tenantId` VARCHAR(191) NOT NULL,
  `applicationId` VARCHAR(191) NOT NULL,
  `provider` VARCHAR(191) NOT NULL,
  `recommendation` VARCHAR(191) NOT NULL,
  `requestJson` JSON NOT NULL,
  `responseJson` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `AusSubmission_tenantId_applicationId_createdAt_idx`(`tenantId`(64), `applicationId`(64), `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `LoanTask` ADD CONSTRAINT `LoanTask_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `LoanTask` ADD CONSTRAINT `LoanTask_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `MortgageApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `UnderwritingCondition` ADD CONSTRAINT `UnderwritingCondition_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `UnderwritingCondition` ADD CONSTRAINT `UnderwritingCondition_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `MortgageApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ConditionHistory` ADD CONSTRAINT `ConditionHistory_conditionId_fkey` FOREIGN KEY (`conditionId`) REFERENCES `UnderwritingCondition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AusSubmission` ADD CONSTRAINT `AusSubmission_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AusSubmission` ADD CONSTRAINT `AusSubmission_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `MortgageApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
