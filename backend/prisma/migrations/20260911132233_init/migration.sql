-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'LOAN_OFFICER', 'UNDERWRITER', 'UNDERWRITING_MANAGER', 'AUDITOR', 'READ_ONLY') NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MortgageApplication` (
    `id` VARCHAR(191) NOT NULL,
    `applicationNumber` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'DOCUMENTS_PENDING', 'DOCUMENT_PROCESSING', 'VERIFICATION_PENDING', 'CREDIT_PENDING', 'UNDERWRITING_READY', 'UNDER_REVIEW', 'MANUAL_REVIEW', 'ADDITIONAL_DOCUMENTS_REQUIRED', 'APPROVED', 'DECLINED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `requestedLoanAmount` DECIMAL(14, 2) NOT NULL,
    `loanPurpose` VARCHAR(191) NOT NULL,
    `loanOfficerId` VARCHAR(191) NULL,
    `underwriterId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `submittedAt` DATETIME(3) NULL,

    UNIQUE INDEX `MortgageApplication_applicationNumber_key`(`applicationNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Applicant` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `postalCode` VARCHAR(191) NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT 'USA',

    UNIQUE INDEX `Applicant_applicationId_key`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employment` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `employmentType` VARCHAR(191) NOT NULL,
    `employerName` VARCHAR(191) NOT NULL,
    `jobTitle` VARCHAR(191) NULL,
    `monthsEmployed` INTEGER NOT NULL,
    `annualIncome` DECIMAL(14, 2) NOT NULL,
    `grossMonthlyIncome` DECIMAL(14, 2) NOT NULL,
    `otherMonthlyIncome` DECIMAL(14, 2) NOT NULL DEFAULT 0,

    UNIQUE INDEX `Employment_applicationId_key`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Liability` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `outstandingBalance` DECIMAL(14, 2) NOT NULL,
    `monthlyPayment` DECIMAL(14, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Asset` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `institution` VARCHAR(191) NULL,
    `currentValue` DECIMAL(14, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Property` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `propertyType` VARCHAR(191) NOT NULL,
    `purchasePrice` DECIMAL(14, 2) NOT NULL,
    `estimatedValue` DECIMAL(14, 2) NOT NULL,
    `occupancyType` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Property_applicationId_key`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Loan` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `termMonths` INTEGER NOT NULL,
    `interestRate` DECIMAL(6, 3) NOT NULL,
    `downPayment` DECIMAL(14, 2) NOT NULL,
    `productName` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Loan_applicationId_key`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Document` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `status` ENUM('UPLOADED', 'QUEUED', 'PROCESSING', 'PARSED', 'VERIFIED', 'FAILED', 'MANUAL_REVIEW_REQUIRED') NOT NULL DEFAULT 'UPLOADED',
    `storageKey` VARCHAR(191) NULL,
    `extractedJson` JSON NULL,
    `verificationJson` JSON NULL,
    `processingVersion` VARCHAR(191) NOT NULL DEFAULT '1.0',
    `processedAt` DATETIME(3) NULL,
    `processingError` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CreditReport` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL DEFAULT 'MOCK_FICO',
    `creditScore` INTEGER NOT NULL,
    `riskBand` VARCHAR(191) NOT NULL,
    `latePayments` INTEGER NOT NULL DEFAULT 0,
    `openAccounts` INTEGER NOT NULL DEFAULT 0,
    `utilizationPct` DECIMAL(6, 2) NOT NULL,
    `outstandingDebt` DECIMAL(14, 2) NOT NULL,
    `retrievedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinancialAssessment` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `grossMonthlyIncome` DECIMAL(14, 2) NOT NULL,
    `monthlyDebt` DECIMAL(14, 2) NOT NULL,
    `debtToIncomeRatio` DECIMAL(7, 3) NOT NULL,
    `loanToValueRatio` DECIMAL(7, 3) NOT NULL,
    `totalAssets` DECIMAL(14, 2) NOT NULL,
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UnderwritingRule` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `metric` ENUM('CREDIT_SCORE', 'DTI_RATIO', 'LTV_RATIO') NOT NULL,
    `approveThreshold` DECIMAL(10, 3) NOT NULL,
    `reviewThreshold` DECIMAL(10, 3) NOT NULL,
    `version` VARCHAR(191) NOT NULL DEFAULT '2026.1',
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `effectiveFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UnderwritingRule_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UnderwritingRun` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `recommendation` ENUM('APPROVE', 'MANUAL_REVIEW', 'DECLINE') NOT NULL,
    `policyVersion` VARCHAR(191) NOT NULL,
    `engineVersion` VARCHAR(191) NOT NULL,
    `inputSnapshot` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RuleEvaluation` (
    `id` VARCHAR(191) NOT NULL,
    `underwritingRunId` VARCHAR(191) NOT NULL,
    `ruleCode` VARCHAR(191) NOT NULL,
    `inputValue` DECIMAL(14, 3) NOT NULL,
    `outcome` ENUM('PASS', 'REVIEW', 'DECLINE') NOT NULL,
    `explanation` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Decision` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `decidedById` VARCHAR(191) NOT NULL,
    `finalDecision` ENUM('APPROVED', 'DECLINED', 'REQUEST_DOCUMENTS') NOT NULL,
    `systemRecommendation` ENUM('APPROVE', 'MANUAL_REVIEW', 'DECLINE') NULL,
    `reason` VARCHAR(191) NOT NULL,
    `override` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditEvent` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MortgageApplication` ADD CONSTRAINT `MortgageApplication_loanOfficerId_fkey` FOREIGN KEY (`loanOfficerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MortgageApplication` ADD CONSTRAINT `MortgageApplication_underwriterId_fkey` FOREIGN KEY (`underwriterId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Applicant` ADD CONSTRAINT `Applicant_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `MortgageApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employment` ADD CONSTRAINT `Employment_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `MortgageApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Liability` ADD CONSTRAINT `Liability_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `MortgageApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Asset` ADD CONSTRAINT `Asset_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `MortgageApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Property` ADD CONSTRAINT `Property_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `MortgageApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Loan` ADD CONSTRAINT `Loan_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `MortgageApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Document` ADD CONSTRAINT `Document_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `MortgageApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CreditReport` ADD CONSTRAINT `CreditReport_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `MortgageApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialAssessment` ADD CONSTRAINT `FinancialAssessment_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `MortgageApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UnderwritingRun` ADD CONSTRAINT `UnderwritingRun_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `MortgageApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RuleEvaluation` ADD CONSTRAINT `RuleEvaluation_underwritingRunId_fkey` FOREIGN KEY (`underwritingRunId`) REFERENCES `UnderwritingRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Decision` ADD CONSTRAINT `Decision_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `MortgageApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Decision` ADD CONSTRAINT `Decision_decidedById_fkey` FOREIGN KEY (`decidedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditEvent` ADD CONSTRAINT `AuditEvent_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `MortgageApplication`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditEvent` ADD CONSTRAINT `AuditEvent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
