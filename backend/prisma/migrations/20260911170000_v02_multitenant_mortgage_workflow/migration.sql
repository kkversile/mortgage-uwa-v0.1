-- V0.2 additive migration. Existing V0.1 tables and rows are preserved.
DROP INDEX `UnderwritingRule_code_key` ON `UnderwritingRule`;

ALTER TABLE `Loan` ADD COLUMN `loanProductId` VARCHAR(191) NULL;

ALTER TABLE `MortgageApplication`
  ADD COLUMN `branchId` VARCHAR(191) NULL,
  ADD COLUMN `channelId` VARCHAR(191) NULL,
  ADD COLUMN `consumerUserId` VARCHAR(191) NULL,
  ADD COLUMN `processorId` VARCHAR(191) NULL,
  ADD COLUMN `tenantId` VARCHAR(191) NULL,
  MODIFY `status` ENUM('APPLICATION_STARTED', 'APPLICATION_SUBMITTED', 'DISCLOSURES_PENDING', 'INTENT_TO_PROCEED', 'PROCESSING', 'VERIFICATIONS_PENDING', 'READY_FOR_UNDERWRITING', 'UNDERWRITING', 'CONDITIONAL_APPROVAL', 'CONDITIONS_PENDING', 'CONDITIONS_REVIEW', 'FINAL_APPROVAL', 'CLEAR_TO_CLOSE', 'CLOSING', 'FUNDED', 'POST_CLOSING', 'COMPLETED', 'WITHDRAWN', 'DENIED', 'SUSPENDED', 'INCOMPLETE', 'DRAFT', 'DOCUMENTS_PENDING', 'DOCUMENT_PROCESSING', 'VERIFICATION_PENDING', 'CREDIT_PENDING', 'UNDERWRITING_READY', 'UNDER_REVIEW', 'MANUAL_REVIEW', 'ADDITIONAL_DOCUMENTS_REQUIRED', 'APPROVED', 'DECLINED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT';

ALTER TABLE `UnderwritingRule` ADD COLUMN `tenantId` VARCHAR(191) NULL;
ALTER TABLE `User` ADD COLUMN `accountType` ENUM('INTERNAL', 'CONSUMER', 'PLATFORM_ADMIN') NOT NULL DEFAULT 'INTERNAL';

CREATE TABLE `Tenant` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `status` ENUM('ACTIVE', 'SUSPENDED', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
  `supportEmail` VARCHAR(191) NULL,
  `supportPhone` VARCHAR(191) NULL,
  `logoUrl` VARCHAR(191) NULL,
  `brandingJson` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Tenant_code_key`(`code`),
  UNIQUE INDEX `Tenant_slug_key`(`slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Branch` (
  `id` VARCHAR(191) NOT NULL,
  `tenantId` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `city` VARCHAR(191) NOT NULL,
  `state` VARCHAR(191) NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Branch_tenantId_code_key`(`tenantId`, `code`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `BusinessChannel` (
  `id` VARCHAR(191) NOT NULL,
  `tenantId` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `BusinessChannel_tenantId_code_key`(`tenantId`, `code`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TenantMembership` (
  `id` VARCHAR(191) NOT NULL,
  `tenantId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `branchId` VARCHAR(191) NULL,
  `role` ENUM('TENANT_ADMIN', 'LOAN_OFFICER', 'LOAN_PROCESSOR', 'UNDERWRITER', 'SENIOR_UNDERWRITER', 'UNDERWRITING_MANAGER', 'CLOSER', 'FUNDER', 'QC_REVIEWER', 'COMPLIANCE_OFFICER', 'AUDITOR', 'BRANCH_MANAGER', 'READ_ONLY') NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `TenantMembership_userId_active_idx`(`userId`, `active`),
  UNIQUE INDEX `TenantMembership_tenantId_userId_role_key`(`tenantId`, `userId`, `role`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LoanProduct` (
  `id` VARCHAR(191) NOT NULL,
  `tenantId` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `productType` VARCHAR(191) NOT NULL,
  `loanPurpose` VARCHAR(191) NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `configuration` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `LoanProduct_tenantId_code_key`(`tenantId`, `code`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TenantSequence` (
  `id` VARCHAR(191) NOT NULL,
  `tenantId` VARCHAR(191) NOT NULL,
  `year` INTEGER NOT NULL,
  `value` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `TenantSequence_tenantId_year_key`(`tenantId`, `year`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `UnderwritingRule_tenantId_enabled_idx` ON `UnderwritingRule`(`tenantId`, `enabled`);
CREATE UNIQUE INDEX `UnderwritingRule_tenantId_code_version_key` ON `UnderwritingRule`(`tenantId`, `code`, `version`);

-- Backfill legacy rows into the default tenant before adding foreign keys.
INSERT INTO `Tenant` (`id`, `code`, `slug`, `name`, `status`, `createdAt`, `updatedAt`)
VALUES ('tenant-demo-community-bank', 'DCB', 'demo-community-bank', 'Demo Community Bank', 'ACTIVE', NOW(3), NOW(3));
INSERT INTO `Tenant` (`id`, `code`, `slug`, `name`, `status`, `createdAt`, `updatedAt`)
VALUES ('tenant-first-national-mortgage', 'FNM', 'first-national-mortgage', 'First National Mortgage', 'ACTIVE', NOW(3), NOW(3));

INSERT INTO `Branch` (`id`, `tenantId`, `code`, `name`, `city`, `state`, `active`, `createdAt`, `updatedAt`)
VALUES ('branch-dcb-austin', 'tenant-demo-community-bank', 'AUSTIN', 'Austin Central', 'Austin', 'TX', true, NOW(3), NOW(3)),
       ('branch-dcb-dallas', 'tenant-demo-community-bank', 'DALLAS', 'Dallas North', 'Dallas', 'TX', true, NOW(3), NOW(3)),
       ('branch-fnm-denver', 'tenant-first-national-mortgage', 'DENVER', 'Denver Main', 'Denver', 'CO', true, NOW(3), NOW(3));
INSERT INTO `BusinessChannel` (`id`, `tenantId`, `code`, `name`, `active`, `createdAt`, `updatedAt`)
VALUES ('channel-dcb-retail', 'tenant-demo-community-bank', 'RETAIL', 'Retail', true, NOW(3), NOW(3)),
       ('channel-fnm-retail', 'tenant-first-national-mortgage', 'RETAIL', 'Retail', true, NOW(3), NOW(3));
INSERT INTO `LoanProduct` (`id`, `tenantId`, `code`, `name`, `productType`, `loanPurpose`, `active`, `createdAt`, `updatedAt`)
VALUES ('product-dcb-conventional', 'tenant-demo-community-bank', 'CONVENTIONAL_30_FIXED', 'Conventional 30-year fixed', 'CONVENTIONAL', 'PURCHASE', true, NOW(3), NOW(3)),
       ('product-fnm-conventional', 'tenant-first-national-mortgage', 'CONVENTIONAL_30_FIXED', 'Conventional 30-year fixed', 'CONVENTIONAL', 'PURCHASE', true, NOW(3), NOW(3));

UPDATE `User` SET `accountType` = 'PLATFORM_ADMIN' WHERE `email` = 'admin@mortgage-uwa.local';
UPDATE `MortgageApplication` SET `tenantId` = 'tenant-demo-community-bank', `branchId` = 'branch-dcb-austin', `channelId` = 'channel-dcb-retail' WHERE `tenantId` IS NULL;
UPDATE `UnderwritingRule` SET `tenantId` = 'tenant-demo-community-bank' WHERE `tenantId` IS NULL;
UPDATE `Loan` SET `loanProductId` = 'product-dcb-conventional' WHERE `loanProductId` IS NULL;

INSERT INTO `TenantMembership` (`id`, `tenantId`, `userId`, `branchId`, `role`, `active`, `createdAt`, `updatedAt`)
SELECT CONCAT('membership-dcb-', LEFT(`id`, 24)), 'tenant-demo-community-bank', `id`, 'branch-dcb-austin',
  CASE `role`
    WHEN 'LOAN_OFFICER' THEN 'LOAN_OFFICER'
    WHEN 'UNDERWRITER' THEN 'UNDERWRITER'
    WHEN 'UNDERWRITING_MANAGER' THEN 'UNDERWRITING_MANAGER'
    WHEN 'AUDITOR' THEN 'AUDITOR'
    ELSE 'TENANT_ADMIN'
  END,
  true, NOW(3), NOW(3)
FROM `User` WHERE `email` <> 'admin@mortgage-uwa.local';

INSERT INTO `TenantMembership` (`id`, `tenantId`, `userId`, `branchId`, `role`, `active`, `createdAt`, `updatedAt`)
SELECT 'membership-dcb-platform-admin', 'tenant-demo-community-bank', `id`, 'branch-dcb-austin', 'TENANT_ADMIN', true, NOW(3), NOW(3)
FROM `User` WHERE `email` = 'admin@mortgage-uwa.local';

ALTER TABLE `Branch` ADD CONSTRAINT `Branch_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `BusinessChannel` ADD CONSTRAINT `BusinessChannel_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `TenantMembership` ADD CONSTRAINT `TenantMembership_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `TenantMembership` ADD CONSTRAINT `TenantMembership_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `TenantMembership` ADD CONSTRAINT `TenantMembership_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `LoanProduct` ADD CONSTRAINT `LoanProduct_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `TenantSequence` ADD CONSTRAINT `TenantSequence_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `MortgageApplication` ADD CONSTRAINT `MortgageApplication_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `MortgageApplication` ADD CONSTRAINT `MortgageApplication_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `MortgageApplication` ADD CONSTRAINT `MortgageApplication_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `BusinessChannel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `MortgageApplication` ADD CONSTRAINT `MortgageApplication_consumerUserId_fkey` FOREIGN KEY (`consumerUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `MortgageApplication` ADD CONSTRAINT `MortgageApplication_processorId_fkey` FOREIGN KEY (`processorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Loan` ADD CONSTRAINT `Loan_loanProductId_fkey` FOREIGN KEY (`loanProductId`) REFERENCES `LoanProduct`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `UnderwritingRule` ADD CONSTRAINT `UnderwritingRule_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
