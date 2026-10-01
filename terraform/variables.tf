variable "aws_region" {
  type    = string
  default = "eu-central-1"
}

variable "project" {
  type    = string
  default = "numberlink"
}

variable "instance_type" {
  type    = string
  default = "t3.small"
}

variable "ami_id" {
  type        = string
  default     = ""
  description = "Leave empty to use the latest Ubuntu 24.04 in this region."
}

variable "ssh_public_key" {
  type        = string
  description = "OpenSSH public key. Creates a key pair in whichever account you apply to."
}

variable "key_name" {
  type        = string
  default     = ""
  description = "Existing or new key pair name. Empty = var.project."
}

variable "db_identifier" {
  type        = string
  default     = ""
  description = "RDS identifier. Empty = var.project. Prod import: fly-stack."
}

variable "db_name" {
  type        = string
  default     = ""
  description = "Initial DB name. Empty = omit (live fly-stack had none)."
}

variable "app_sg_name" {
  type        = string
  default     = ""
  description = "Empty = {project}-app. Prod import: launch-wizard-1."
}

variable "rds_sg_name" {
  type        = string
  default     = ""
  description = "Empty = {project}-rds. Prod import: rds-ec2-1."
}

variable "rds_client_sg_name" {
  type        = string
  default     = ""
  description = "Empty = {project}-rds-client. Prod import: ec2-rds-1."
}

variable "instance_subnet_id" {
  type        = string
  default     = ""
  description = "Must match the live instance for import. Empty = first default-VPC subnet."
}

variable "db_subnet_group_name" {
  type        = string
  default     = ""
  description = "Empty = db_identifier. Import the real subnet group name."
}

variable "db_username" {
  type    = string
  default = "postgres"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "db_allocated_storage" {
  type    = number
  default = 20
}

variable "instance_name" {
  type    = string
  default = "numberlink"
}

variable "db_deletion_protection" {
  type    = bool
  default = true
}

variable "db_max_allocated_storage" {
  type    = number
  default = 0
}

variable "db_storage_type" {
  type    = string
  default = "gp3"
}

variable "db_kms_key_id" {
  type    = string
  default = ""
}

variable "db_skip_final_snapshot" {
  type    = bool
  default = false
}

variable "db_backup_retention_period" {
  type    = number
  default = 7
}

variable "db_copy_tags_to_snapshot" {
  type    = bool
  default = false
}

variable "db_performance_insights_enabled" {
  type    = bool
  default = false
}

variable "db_monitoring_interval" {
  type    = number
  default = 0
}

variable "db_monitoring_role_arn" {
  type    = string
  default = ""
}
