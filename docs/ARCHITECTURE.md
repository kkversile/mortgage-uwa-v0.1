# Architecture

## Local V0.1

```text
Angular :6002
    |
    v
NestJS :7002
    |
    v
Prisma
    |
    v
MySQL

+ mock credit provider
+ deterministic financial engine
+ deterministic underwriting engine
+ document metadata / verification foundation
+ immutable underwriting-run history
+ append-only audit events
```

## Target AWS architecture

```text
CloudFront / S3 Angular
        |
        v
Amazon Cognito (OIDC/SSO)
        |
        v
API Gateway
        |
        v
ECS Fargate - NestJS
        |
   +----+---------------------+
   |                          |
Aurora MySQL              Private S3
                              |
                              v
                             SQS
                              |
                              v
                            Lambda
                              |
                              v
                           Textract
```

### Principles
1. NestJS stays a modular monolith for core banking workflow.
2. Lambda is used for asynchronous/event-driven workloads, not every API.
3. Underwriting logic is deterministic, versioned and independently testable.
4. Every underwriting run stores the inputs and policy version that produced it.
5. Final human decisions and overrides are audited.
6. Real credit-bureau vendors are integrated only through provider adapters.
