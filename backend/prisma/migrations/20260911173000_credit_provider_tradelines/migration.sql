CREATE TABLE `CreditTradeline` (
  `id` VARCHAR(191) NOT NULL,
  `creditReportId` VARCHAR(191) NOT NULL,
  `creditorName` VARCHAR(191) NOT NULL,
  `accountType` VARCHAR(191) NOT NULL,
  `balance` DECIMAL(14, 2) NOT NULL,
  `creditLimit` DECIMAL(14, 2) NULL,
  `monthlyPayment` DECIMAL(14, 2) NOT NULL,
  `latePayments` INTEGER NOT NULL DEFAULT 0,
  `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `CreditTradeline_creditReportId_idx`(`creditReportId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CreditTradeline` ADD CONSTRAINT `CreditTradeline_creditReportId_fkey` FOREIGN KEY (`creditReportId`) REFERENCES `CreditReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
