# Mortgage UWA V0.2

V0.2 evolves the existing V0.1 Angular/NestJS portfolio demo into a multi-tenant mortgage origination and underwriting workflow while preserving the existing MySQL data, local infrastructure, and ports.

> Portfolio/demo software only. Applicant data, credit data, documents, providers, and underwriting thresholds are synthetic. Do not use this software for real lending decisions.

## V0.2 at a glance

- Tenants: Demo Community Bank (`DCB`) and First National Mortgage (`FNM`)
- Portals: `/consumer`, `/operations`, and `/admin`
- Frontend: `http://localhost:6002`; backend: `http://localhost:7002`
- Swagger: `http://localhost:7002/api/docs`
- MySQL via Prisma; LocalStack-compatible Floci at `http://localhost:4566`
- Tenant-scoped S3 objects, SQS upload queue, DLQ, and worker
- `pdf-parse` text extraction with Poppler/Tesseract OCR fallback
- Deterministic mock credit provider, Demo AUS, conditions, tasks, and audited workflow transitions

V0.2 migrations are additive: `v02_multitenant_workflow`, `credit_provider_tradelines`, and `workflow_tasks_conditions_aus`. Do not run `prisma migrate reset`; existing records are intentionally retained.

```text
Angular 6002 (consumer | operations | admin)
                    |
             NestJS modular API 7002
                    |
              Prisma / MySQL 3308
                    |
        Floci S3 + SQS + DLQ 4566
                    |
          document worker + OCR
```

Clean-room portfolio starter for a Mortgage Underwriting Assistant.

## Stack
- Angular frontend (`http://localhost:6002`)
- NestJS backend (`http://localhost:7002`)
- Swagger (`http://localhost:7002/api/docs`)
- Prisma + MySQL
- JWT demo authentication + RBAC foundation
- Deterministic financial/underwriting engine
- Synthetic demo applicants and applications
- AWS-ready adapter boundaries for S3/SQS/Lambda/Textract/Cognito

> Portfolio/demo software only. All applicant data, credit data and underwriting thresholds are synthetic. Do not use for real lending decisions.

## Local setup

### 1. MySQL
Create a database named `mortgage_uwa` in an existing MySQL server, or run the isolated repository service:

```bash
docker compose up -d mysql
```

The compose service exposes MySQL on host port `3308` so it does not interfere with an existing local MySQL on `3306`.

### 2. Backend

```bash
cd backend
copy .env.example .env   # Windows CMD
# or: cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run local-aws:init
npm run start:dev
```

Backend: `http://localhost:7002`  
Swagger: `http://localhost:7002/api/docs`

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend: `http://localhost:6002`

## Portals and demo logins

All accounts below use the synthetic password `Mortgage@123`.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@mortgage-uwa.local` | `Mortgage@123` |
| Loan Officer | `loan.officer@mortgage-uwa.local` | `Mortgage@123` |
| Underwriter | `underwriter@mortgage-uwa.local` | `Mortgage@123` |
| Manager | `manager@mortgage-uwa.local` | `Mortgage@123` |
| Auditor | `auditor@mortgage-uwa.local` | `Mortgage@123` |
| Tenant admin | `tenant.admin@mortgage-uwa.local` | `Mortgage@123` |
| Processor | `processor@mortgage-uwa.local` | `Mortgage@123` |
| Consumer | `consumer@mortgage-uwa.local` | `Mortgage@123` |
| FNM underwriter | `second.underwriter@mortgage-uwa.local` | `Mortgage@123` |

## Demo scenarios
- `MUA-2026-000001`: strong application -> expected APPROVE
- `MUA-2026-000002`: higher DTI -> expected MANUAL_REVIEW
- `MUA-2026-000003`: weak credit/DTI/LTV -> expected DECLINE

## AWS evolution path
Local adapters are intentionally replaceable:

- local/document metadata -> private Amazon S3 + presigned uploads
- synchronous demo processing -> SQS -> Lambda -> Textract
- local JWT -> Amazon Cognito / enterprise OIDC SSO
- NestJS API -> ECS Fargate behind API Gateway
- local env secrets -> AWS Secrets Manager + KMS
- console logs -> CloudWatch / OpenTelemetry

See `docs/ARCHITECTURE.md` and `infrastructure/terraform/README.md`.

## Local AWS document workflow

The app uses the LocalStack-compatible service at `http://localhost:4566` with synthetic credentials from `backend/.env`. Ensure S3 and SQS are available, then run `npm run local-aws:init` once (it is idempotent). Start the local processing worker in a second terminal:

```bash
cd backend
npm run worker:dev
```

Uploading a PDF/JPG/PNG from an application detail page stores it in the private local S3 bucket, publishes a versioned `DOCUMENT_UPLOADED` event to SQS, and lets the worker extract text from text-based PDFs with `pdf-parse`. If a PDF has no usable text layer, or if an image is uploaded, the worker renders PDFs with Poppler when needed and uses local Tesseract OCR. Credit reports containing a recognizable FICO/Credit Score update the application's credit report. No LLM or paid cloud OCR is required for this local path.

### Sample PDF documents

The synthetic DOCX samples in `fixtures/sample-documents` can be opened in Word or LibreOffice and exported as PDF:

- `sample-credit-report.docx` contains FICO Score 720 and is intended for the `CREDIT_REPORT` upload type.
- `sample-payslip.docx` contains Gross Pay $8,000.00 and is intended for the `PAYSLIP` upload type.
- `sample-bank-statement.docx` contains Ending Balance $85,000.00 and is intended for the `BANK_STATEMENT` upload type.

After conversion, upload the PDF from an application detail page. The worker stores the extracted text under the document's `extractedJson.text` field and displays detected score information in the document list.

Ready-to-upload PDF fixtures are also available under `output/pdf`:

- `sample-credit-report.pdf` - selectable text with FICO/Credit Score 720
- `sample-payslip.pdf` - selectable text with Gross Pay $8,000.00
- `sample-bank-statement.pdf` - selectable text with Ending Balance $85,000.00
- `sample-credit-report-scanned.pdf` - image-only PDF with OCR score 735

Use `CREDIT_REPORT` for the two credit reports, `PAYSLIP` for the pay statement, and `BANK_STATEMENT` for the bank statement. The scanned fixture requires the local Poppler renderer plus Tesseract OCR configured in the backend environment.

This project uses synthetic applicant data, mock credit information and demonstration underwriting rules. It is not intended for real lending decisions.

## V0.2 document workflow

Upload a PDF, JPG, or PNG from an application detail page. The API stores a private tenant/application object and publishes a versioned `DOCUMENT_UPLOADED` event. The worker first extracts PDF text with `pdf-parse`; if the text layer is empty, Poppler renders the page and local Tesseract OCR extracts it. Recognizable credit-score text updates the credit report and the protected download endpoint returns the original file.

No LLM or paid cloud OCR is used by the local path. Tesseract is free and open source. Configure `TESSERACT_PATH` and `POPPLER_PATH` only when those executables are not on `PATH`.

Synthetic DOCX samples are in `fixtures/sample-documents`; convert them to PDF in Word or LibreOffice before upload:

- `sample-credit-report.docx` — FICO score 720; use `CREDIT_REPORT`
- `sample-payslip.docx` — gross pay $8,000; use `PAYSLIP`
- `sample-bank-statement.docx` — ending balance $85,000; use `BANK_STATEMENT`

## V0.2 verification

```powershell
cd backend
npx prisma validate
npx prisma migrate deploy
npm run build
npm test -- --runInBand

cd ..\frontend
npm run build
```

The local AWS initializer is idempotent and creates/retains the private document bucket, upload queue, and DLQ. The mock credit provider and Demo AUS are replaceable demo boundaries, not real bureau/AUS integrations.
