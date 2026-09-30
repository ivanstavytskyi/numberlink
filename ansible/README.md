# Ansible

Put **secrets on the server first**, then run `run.sh`. The script pulls the repo from GitHub; it does not download `vault.yml`.

```bash
# on your laptop
ssh ubuntu@EC2 'mkdir -p ~/numberlink-service'
scp vault.yml ubuntu@EC2:~/numberlink-service/vault.yml

# on the EC2
curl -fsSL https://raw.githubusercontent.com/ivanstavytskyi/Numberlink/main/ansible/run.sh | bash
```

Default vault path: `~/numberlink-service/vault.yml` (next to the clone, not inside git). Override with `NUMBERLINK_VAULT`.

Later app deploys: GitHub Actions.

| Tag | What |
|---|---|
| `base` | swap, apt |
| `docker` | Docker Engine |
| `tls` | Certbot |
| `nginx` | host vhosts |
| `app` | clone, `.env` if missing, compose |
