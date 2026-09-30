output "public_ip" {
  description = "SSH here and point Cloudflare A records here."
  value       = module.ec2.public_ip
}

output "rds_endpoint" {
  description = "RDS hostname. Ansible vault db_url = this host plus :5432."
  value       = module.rds.address
}

output "db_url" {
  description = "Copy into ansible vault.yml as db_url."
  value       = "${module.rds.address}:5432"
}

output "instance_id" {
  value = module.ec2.instance_id
}
