# App SG: 22/80/443 only. Extra live ports (3000, 7000, 8000, 587, ICMP) are dropped on apply after import.

resource "aws_security_group" "app" {
  name        = var.app_sg_name
  description = "SSH, HTTP, HTTPS"
  vpc_id      = var.vpc_id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    ignore_changes = [description]
  }
}

# Live pairing SG on the instance (ec2-rds-1): no inbound. RDS allows 5432 from this SG.

resource "aws_security_group" "rds_client" {
  name        = var.rds_client_sg_name
  description = "Source SG for RDS; attached to the app instance"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    ignore_changes = [description, ingress, egress]
  }
}

resource "aws_security_group" "rds" {
  name        = var.rds_sg_name
  description = "PostgreSQL from the instance RDS-client SG"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.rds_client.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    ignore_changes = [description, ingress, egress]
  }
}
