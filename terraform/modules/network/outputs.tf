output "app_security_group_id" {
  value = aws_security_group.app.id
}

output "rds_client_security_group_id" {
  value = aws_security_group.rds_client.id
}

output "rds_security_group_id" {
  value = aws_security_group.rds.id
}
