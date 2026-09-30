data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_ami" "ubuntu" {
  count       = var.ami_id == "" ? 1 : 0
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

locals {
  ami_id               = var.ami_id != "" ? var.ami_id : data.aws_ami.ubuntu[0].id
  subnet_ids           = sort(data.aws_subnets.default.ids)
  key_name             = var.key_name != "" ? var.key_name : var.project
  db_identifier        = var.db_identifier != "" ? var.db_identifier : var.project
  db_subnet_group_name = var.db_subnet_group_name != "" ? var.db_subnet_group_name : local.db_identifier
  instance_subnet_id   = var.instance_subnet_id != "" ? var.instance_subnet_id : local.subnet_ids[0]
  app_sg_name          = var.app_sg_name != "" ? var.app_sg_name : "${var.project}-app"
  rds_sg_name          = var.rds_sg_name != "" ? var.rds_sg_name : "${var.project}-rds"
  rds_client_sg_name   = var.rds_client_sg_name != "" ? var.rds_client_sg_name : "${var.project}-rds-client"
}

module "network" {
  source              = "./modules/network"
  vpc_id              = data.aws_vpc.default.id
  app_sg_name         = local.app_sg_name
  rds_sg_name         = local.rds_sg_name
  rds_client_sg_name  = local.rds_client_sg_name
}

module "ec2" {
  source             = "./modules/ec2"
  instance_name      = var.instance_name
  ami_id             = local.ami_id
  instance_type      = var.instance_type
  key_name           = local.key_name
  ssh_public_key     = var.ssh_public_key
  subnet_id          = local.instance_subnet_id
  security_group_ids = [
    module.network.app_security_group_id,
    module.network.rds_client_security_group_id,
  ]
}

module "rds" {
  source              = "./modules/rds"
  identifier          = local.db_identifier
  subnet_group_name   = local.db_subnet_group_name
  instance_class      = var.db_instance_class
  allocated_storage   = var.db_allocated_storage
  db_name             = var.db_name
  username            = var.db_username
  password            = var.db_password
  subnet_ids          = local.subnet_ids
  security_group_id   = module.network.rds_security_group_id
  deletion_protection              = var.db_deletion_protection
  max_allocated_storage            = var.db_max_allocated_storage
  storage_type                     = var.db_storage_type
  kms_key_id                       = var.db_kms_key_id
  skip_final_snapshot              = var.db_skip_final_snapshot
  backup_retention_period          = var.db_backup_retention_period
  copy_tags_to_snapshot            = var.db_copy_tags_to_snapshot
  performance_insights_enabled     = var.db_performance_insights_enabled
  monitoring_interval              = var.db_monitoring_interval
  monitoring_role_arn              = var.db_monitoring_role_arn
}
