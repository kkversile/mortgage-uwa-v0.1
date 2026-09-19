# Terraform scaffold

This folder is intentionally not required for local development.

The target AWS modules are:
- S3 private document bucket
- SQS document-processing queue + DLQ
- Lambda document worker
- IAM least-privilege policies
- Cognito user pool / OIDC federation
- API Gateway
- ECS Fargate service for NestJS
- Aurora MySQL / RDS MySQL
- Secrets Manager + KMS
- CloudWatch alarms/logging

V0.1 ships with only a minimal S3/SQS scaffold so the local product can be validated before creating cloud cost.
