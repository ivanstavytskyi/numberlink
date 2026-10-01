# Terraform — EC2, RDS, security groups. App install stays in Ansible.

## Layout

| Path | What |
|---|---|
| `bootstrap/github-oidc.yaml` | One-time CloudFormation: GitHub can assume an AWS role |
| `bootstrap/state-bucket.yaml` | S3 bucket for state (`use_lockfile`) |
| `modules/network` | App SG 22/80/443, RDS-client SG on the instance, RDS SG 5432 from that client |
| `modules/ec2` | Instance + Elastic IP + key pair |
| `modules/rds` | Private Postgres |
| `.github/workflows/terraform.yml` | PR: plan. `main`: bucket, then apply |

## Empty AWS account

1. CloudFormation: `bootstrap/github-oidc.yaml` → GitHub Secret `AWS_ROLE_ARN`.
2. Secrets: `TF_SSH_PUBLIC_KEY`, `TF_DB_PASSWORD`.
3. Environment `production` + required reviewers.
4. For a **new** account, use default SG names (`numberlink-app` etc.): clear `app_sg_name` / `rds_*` / `ami_id` / `key_name` / `db_identifier` in `config.auto.tfvars` or they will reuse fly-stack names.
5. Merge to `main` → apply creates the stack. Outputs: `public_ip`, `db_url` → Cloudflare, `EC2_HOST`, Ansible.

## Existing prod (this account) — import, then Actions only changes SG rules

Do not apply with empty state. `config.auto.tfvars` already has AMI, `flystack`, `fly-stack`, and live SG names.

### 1. S3 backend

Deploy `bootstrap/state-bucket.yaml` (console or CLI). Then from a laptop with `terraform-cli` keys (not SES):

```powershell
$env:AWS_REGION = 'eu-central-1'
$env:TF_VAR_ssh_public_key = (Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub" -Raw).Trim()
$env:TF_VAR_db_password = 'ignored-after-import'

$bucket = (aws cloudformation describe-stacks --stack-name numberlink --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" --output text)
Set-Location -LiteralPath '...\numberlink\terraform'
terraform init -reconfigure -backend-config="bucket=$bucket" -backend-config="region=eu-central-1"
```

`TF_SSH_PUBLIC_KEY` / `ssh_public_key` must be the **flystack** `.pub`, the same key as on the instance.

### 2. IDs from AWS — paste subnet (and subnet group name) into `config.auto.tfvars`

```powershell
aws ec2 describe-instances --region eu-central-1 --filters Name=instance-state-name,Values=running --query "Reservations[].Instances[].{Id:InstanceId,Subnet:SubnetId,Sgs:SecurityGroups,Key:KeyName,Ami:ImageId}" --output json
aws ec2 describe-addresses --region eu-central-1 --output json
aws rds describe-db-instances --region eu-central-1 --db-instance-identifier fly-stack --query "DBInstances[0].{SubnetGroup:DBSubnetGroup.DBSubnetGroupName,Sgs:VpcSecurityGroups}" --output json
```

Set `instance_subnet_id` and `db_subnet_group_name` to those values. Commit that (not secrets).

### 3. Import (once)

Replace the IDs:

```powershell
terraform import module.ec2.aws_key_pair.app flystack
terraform import module.ec2.aws_instance.app i-0997cd79dfa1c278e
terraform import module.ec2.aws_eip.app eipalloc-04980fa1245a1979d
terraform import module.network.aws_security_group.app sg-0b57f4b8fb3502f97
terraform import module.network.aws_security_group.rds_client sg-0f09506d9084ce5a4
terraform import module.network.aws_security_group.rds sg-0ccc238eecc6ecce8
terraform import module.rds.aws_db_subnet_group.app rds-ec2-db-subnet-group-1
terraform import module.rds.aws_db_instance.app fly-stack
```

### 4. Fitting — only then apply

```powershell
terraform plan -input=false -no-color
```

Expect **update** on `launch-wizard-1` (drop 3000/7000/8000/587/ICMP). Must **not** be `replace` / `- destroy` on instance or RDS. If you see replace — subnet, AMI, key, or SGs still mismatch; do not apply.

When plan is SG-only, apply from the laptop **or** merge and let Actions apply. After that, a new ingress in `modules/network` is a small PR.

Never commit `terraform.tfvars`, `*.tfstate`, or `.terraform/`.
