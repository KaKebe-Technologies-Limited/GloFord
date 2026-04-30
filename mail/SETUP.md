# Mail Server Setup Runbook — gloford.org
# Ubuntu 24.04 VPS · docker-mailserver · Nginx · certbot

## Final folder structure

```
mail/
├── docker-compose.yml
├── docker-data/dms/
│   ├── config/
│   │   ├── postfix-main.cf
│   │   └── postfix-transport
│   ├── mail-data/
│   ├── mail-state/
│   └── mail-logs/
├── nginx-proxy/
│   └── mail.gloford.org.conf
├── DNS-RECORDS.txt
└── SETUP.md  ← this file
```

---

## Step 1 — DNS records (do this first)

Add all records from `DNS-RECORDS.txt` to your DNS provider.
A and MX records must propagate before certbot can issue a cert.

Check propagation: https://dnschecker.org/#A/mail.gloford.org

---

## Step 2 — Open firewall ports on the VPS

```bash
sudo ufw allow 25/tcp
sudo ufw allow 465/tcp
sudo ufw allow 587/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
sudo ufw status
```

---

## Step 3 — Issue TLS certificate with certbot

Install certbot on the host (not in Docker):

```bash
sudo apt update
sudo apt install -y certbot
```

Create the webroot directory:

```bash
sudo mkdir -p /var/www/certbot
```

Start Nginx in HTTP-only mode first (comment out the HTTPS server block
in `nginx-proxy/mail.gloford.org.conf` temporarily), then:

```bash
cd mail/
docker compose up -d nginx
```

Issue the cert:

```bash
sudo certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  -d mail.gloford.org \
  --email admin@gloford.org \
  --agree-tos \
  --no-eff-email
```

Cert is written to `/etc/letsencrypt/live/mail.gloford.org/`.

Uncomment the HTTPS server block in `nginx-proxy/mail.gloford.org.conf`,
then reload Nginx:

```bash
docker compose exec nginx nginx -s reload
```

---

## Step 4 — Start the mail server

```bash
cd mail/
docker compose up -d
```

Wait ~30 seconds, then check logs:

```bash
docker compose logs -f mailserver
```

---

## Step 5 — Create the no-reply account

```bash
docker exec mailserver setup email add no-reply@gloford.org $(openssl rand -base64 24)
```

Save the generated password — you need it in Step 7.

---

## Step 6 — Get the DKIM public key and add to DNS

```bash
docker exec mailserver cat /tmp/docker-mailserver/opendkim/keys/gloford.org/mail.txt
```

Copy the `p=` value and add it as the DKIM TXT record:
- Name: `mail._domainkey.gloford.org`
- Value: `"v=DKIM1; k=rsa; p=<YOUR_KEY>"`

---

## Step 7 — Wire the app to use the self-hosted mail server

Update `.env` in the main app:

```bash
# Self-hosted SMTP — replaces Resend
MAIL_SMTP_HOST=mail.gloford.org
MAIL_SMTP_PORT=587
MAIL_SMTP_USER=no-reply@gloford.org
MAIL_SMTP_PASS=<password from step 5>
MAIL_FROM="Gloford Foundation <no-reply@gloford.org>"
# Keep RESEND_API_KEY blank or remove it
RESEND_API_KEY=
```

---

## Step 8 — Test deliverability

```bash
# From inside the container
docker exec mailserver sendmail -v test@gmail.com <<EOF
Subject: Test from Gloford
From: no-reply@gloford.org
To: test@gmail.com

Test email from self-hosted mail server.
EOF
```

- https://mail-tester.com — aim for 10/10
- https://mxtoolbox.com/SuperTool.aspx — verify SPF, DKIM, DMARC

---

## Step 9 — Tighten DMARC after 2 weeks

Monitor reports at `dmarc-reports@gloford.org`. Once clean, update DNS:

```
"v=DMARC1; p=reject; rua=mailto:dmarc-reports@gloford.org; ..."
```

---

## Cert auto-renewal

The certbot container in `docker-compose.yml` runs `certbot renew` every
12 hours automatically. After renewal, reload Nginx and the mail server:

```bash
docker compose exec nginx nginx -s reload
docker compose restart mailserver
```

Add this to crontab for fully automatic renewal:

```bash
sudo crontab -e
# Add:
0 3 * * * cd /path/to/mail && docker compose exec nginx nginx -s reload && docker compose restart mailserver
```

---

## Port 25 outbound blocked?

Many VPS providers block outbound port 25. Test:

```bash
telnet smtp.gmail.com 25
```

If it hangs, uncomment the `RELAY_*` vars in `docker-compose.yml` and
use SendGrid or Mailgun as a relay.
