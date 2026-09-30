resource "aws_db_subnet_group" "app" {
  name       = var.subnet_group_name
  subnet_ids = var.subnet_ids

  lifecycle {
    ignore_changes = [description, subnet_ids]
  }
}

resource "aws_db_instance" "app" {
  identifier                   = var.identifier
  engine                       = "postgres"
  instance_class               = var.instance_class
  allocated_storage            = var.allocated_storage
  max_allocated_storage        = var.max_allocated_storage > 0 ? var.max_allocated_storage : null
  db_name                      = var.db_name == "" ? null : var.db_name
  username                     = var.username
  password                     = var.password
  db_subnet_group_name         = aws_db_subnet_group.app.name
  vpc_security_group_ids       = [var.security_group_id]
  publicly_accessible          = false
  storage_encrypted            = true
  storage_type                 = var.storage_type
  kms_key_id                   = var.kms_key_id == "" ? null : var.kms_key_id
  skip_final_snapshot          = var.skip_final_snapshot
  deletion_protection          = var.deletion_protection
  backup_retention_period      = var.backup_retention_period
  copy_tags_to_snapshot        = var.copy_tags_to_snapshot
  performance_insights_enabled = var.performance_insights_enabled
  monitoring_interval          = var.monitoring_interval
  monitoring_role_arn          = var.monitoring_role_arn == "" ? null : var.monitoring_role_arn

  lifecycle {
    ignore_changes = [password, engine_version]
  }
}
