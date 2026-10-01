terraform {
  required_version = ">= 1.11.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # bucket and region come from CloudFormation outputs via:
  #   terraform init -backend-config=bucket=... -backend-config=region=...
  backend "s3" {
    key          = "numberlink/terraform.tfstate"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region
}
