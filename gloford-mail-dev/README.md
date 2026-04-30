# Gloford Mail — Local Dev Setup

## Folder structure

```
gloford-mail-dev/
├── docker-compose.yml          ← local dev container
├── config/
│   ├── postfix-main.cf         ← transport_maps config (already done)
│   └── postfix-transport       ← discard rule for no-reply (already done)
├── nginx-proxy/
│   └── local-mail.conf         ← Nginx placeholder proxy
└── test_send_email.py          ← Python test script
```

## 1. Add hosts file entry

This makes `mail.gloford.org` resolve to localhost on your machine.

**Windows** — open Notepad as Administrator, edit:
```
C:\Windows\System32\drivers\etc\hosts
```
Add this line:
```
127.0.0.1  mail.gloford.org
```

**Mac / Linux** — run:
```bash
sudo sh -c 'echo "127.0.0.1  mail.gloford.org" >> /etc/hosts'
```

Verify it works:
```bash
ping mail.gloford.org
# should show 127.0.0.1
```

## 2. Start the containers

```bash
cd gloford-mail-dev
docker compose up -d
```

Wait ~30 seconds for Postfix to initialise, then check:
```bash
docker compose logs -f mailserver
```

## 3. Create the no-reply account

```bash
docker exec mailserver-dev setup email add no-reply@gloford.org localdevpassword123
```

## 4. Run the Python test

```bash
# Install nothing — uses stdlib smtplib only
python test_send_email.py --to your@email.com
```

The script tries port 587 first, then falls back to port 25.
In local dev, port 25 works without auth because `PERMIT_DOCKER=connected-networks`.

## 5. Check mail logs

```bash
docker exec mailserver-dev tail -f /var/log/mail/mail.log
```

## 6. Nginx proxy

The Nginx proxy is available at http://localhost:8025
It returns a placeholder until you add a webmail container (Roundcube etc.).
To add webmail, uncomment the `proxy_pass` block in `nginx-proxy/local-mail.conf`.

## Moving to production

When you're ready to deploy to the VPS:
1. Use `mail/docker-compose.yml` (the production compose)
2. Use `mail/nginx-mail.gloford.org.conf` (full TLS Nginx config)
3. Add all DNS records from `mail/DNS-RECORDS.txt`
4. Follow `mail/SETUP.md` step by step

## Troubleshooting

| Problem | Fix |
|---|---|
| `Connection refused` on port 25/587 | Container not started — run `docker compose up -d` |
| `mail.gloford.org` doesn't resolve | Hosts file entry missing — see step 1 |
| `Authentication failed` on 587 | Use port 25 for local dev, or create account first |
| Logs show `postmap` errors | Check `config/postfix-transport` has no Windows line endings |
