provider "aws" { region = var.aws_region }

locals { prefix = "${var.project_name}-${var.environment}" }

resource "aws_s3_bucket" "documents" {
  bucket_prefix = "${local.prefix}-documents-"
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket                  = aws_s3_bucket.documents.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_sqs_queue" "document_dlq" {
  name = "${local.prefix}-document-processing-dlq"
}

resource "aws_sqs_queue" "document_processing" {
  name = "${local.prefix}-document-processing"
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.document_dlq.arn
    maxReceiveCount     = 3
  })
}

output "documents_bucket" { value = aws_s3_bucket.documents.bucket }
output "document_queue_url" { value = aws_sqs_queue.document_processing.url }
