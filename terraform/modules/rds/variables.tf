variable "identifier" {
  type = string
}

variable "subnet_group_name" {
  type = string
}

variable "instance_class" {
  type = string
}

variable "allocated_storage" {
  type = number
}

variable "db_name" {
  type = string
}

variable "username" {
  type = string
}

variable "password" {
  type      = string
  sensitive = true
}

variable "subnet_ids" {
  type = list(string)
}

variable "security_group_id" {
  type = string
}

variable "deletion_protection" {
  type = bool
}

variable "max_allocated_storage" {
  type    = number
  default = 0
}

variable "storage_type" {
  type    = string
  default = "gp3"
}

variable "kms_key_id" {
  type    = string
  default = ""
}

variable "skip_final_snapshot" {
  type    = bool
  default = false
}

variable "backup_retention_period" {
  type    = number
  default = 7
}

variable "copy_tags_to_snapshot" {
  type    = bool
  default = false
}

variable "performance_insights_enabled" {
  type    = bool
  default = false
}

variable "monitoring_interval" {
  type    = number
  default = 0
}

variable "monitoring_role_arn" {
  type    = string
  default = ""
}
