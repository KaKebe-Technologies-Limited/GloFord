#!/usr/bin/env python3
"""
test_send_email.py
──────────────────
Tests sending a no-reply email through the local docker-mailserver container.

Requirements:
    pip install secure-smtplib   # already in stdlib as smtplib

Usage:
    python test_send_email.py --to your@email.com

The script tries port 587 (STARTTLS) first, then falls back to port 25
(plain SMTP, no auth) which works in local dev with PERMIT_DOCKER set.
"""

import argparse
import smtplib
import socket
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

# ── Config ────────────────────────────────────────────────────
MAIL_HOST = "mail.gloford.org"   # resolves to 127.0.0.1 via hosts file
MAIL_FROM = "no-reply@gloford.org"
SUBJECT   = f"[Gloford Dev] Test email — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"

HTML_BODY = """\
<html>
  <body style="font-family: sans-serif; color: #1a1a1a; padding: 24px;">
    <h2 style="color: #1d4ed8;">Gloford Mail Server — Test</h2>
    <p>This is a test email sent from the local docker-mailserver container.</p>
    <ul>
      <li><strong>From:</strong> no-reply@gloford.org</li>
      <li><strong>Server:</strong> mail.gloford.org (127.0.0.1)</li>
      <li><strong>Sent at:</strong> {timestamp}</li>
    </ul>
    <p style="color: #6b7280; font-size: 12px;">
      If you received this, your local mail server is working correctly.
    </p>
  </body>
</html>
""".format(timestamp=datetime.now().isoformat())

TEXT_BODY = (
    "Gloford Mail Server — Test\n\n"
    "This is a test email sent from the local docker-mailserver container.\n"
    f"Sent at: {datetime.now().isoformat()}\n"
)


def build_message(to_addr: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = SUBJECT
    msg["From"]    = f"Gloford Foundation <{MAIL_FROM}>"
    msg["To"]      = to_addr
    msg["X-Mailer"] = "Gloford dev test script"
    msg.attach(MIMEText(TEXT_BODY, "plain"))
    msg.attach(MIMEText(HTML_BODY, "html"))
    return msg


def try_port_587(to_addr: str, msg: MIMEMultipart) -> bool:
    """STARTTLS submission on port 587 (requires a valid account + password)."""
    print("→ Trying port 587 (STARTTLS)…")
    try:
        with smtplib.SMTP(MAIL_HOST, 587, timeout=10) as smtp:
            smtp.set_debuglevel(1)
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            # In local dev without auth configured, this may fail.
            # Add credentials here if you created an account:
            # smtp.login("no-reply@gloford.org", "your-password")
            smtp.sendmail(MAIL_FROM, [to_addr], msg.as_string())
        print("✓ Sent via port 587")
        return True
    except Exception as e:
        print(f"  port 587 failed: {e}")
        return False


def try_port_25(to_addr: str, msg: MIMEMultipart) -> bool:
    """Plain SMTP on port 25 — works locally with PERMIT_DOCKER=connected-networks."""
    print("→ Trying port 25 (plain SMTP, no auth)…")
    try:
        with smtplib.SMTP(MAIL_HOST, 25, timeout=10) as smtp:
            smtp.set_debuglevel(1)
            smtp.ehlo()
            smtp.sendmail(MAIL_FROM, [to_addr], msg.as_string())
        print("✓ Sent via port 25")
        return True
    except Exception as e:
        print(f"  port 25 failed: {e}")
        return False


def check_hosts_entry() -> None:
    """Warn if mail.gloford.org doesn't resolve to localhost."""
    try:
        ip = socket.gethostbyname(MAIL_HOST)
        if ip not in ("127.0.0.1", "::1"):
            print(
                f"⚠  {MAIL_HOST} resolves to {ip}, not 127.0.0.1.\n"
                f"   Add this line to your hosts file:\n"
                f"   127.0.0.1  mail.gloford.org\n"
            )
        else:
            print(f"✓ {MAIL_HOST} resolves to {ip} (hosts file OK)")
    except socket.gaierror:
        print(
            f"✗ Cannot resolve {MAIL_HOST}.\n"
            f"  Add this line to your hosts file and retry:\n\n"
            f"  Windows:  C:\\Windows\\System32\\drivers\\etc\\hosts\n"
            f"  Mac/Linux: /etc/hosts\n\n"
            f"  127.0.0.1  mail.gloford.org\n"
        )
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Test Gloford local mail server")
    parser.add_argument("--to", required=True, help="Recipient email address")
    args = parser.parse_args()

    print(f"\nGloford mail server test")
    print(f"{'─' * 40}")
    print(f"Host : {MAIL_HOST}")
    print(f"From : {MAIL_FROM}")
    print(f"To   : {args.to}")
    print(f"{'─' * 40}\n")

    check_hosts_entry()

    msg = build_message(args.to)

    if try_port_587(args.to, msg):
        sys.exit(0)

    if try_port_25(args.to, msg):
        sys.exit(0)

    print("\n✗ All ports failed. Check that the container is running:")
    print("  docker compose -f gloford-mail-dev/docker-compose.yml ps")
    sys.exit(1)


if __name__ == "__main__":
    main()
