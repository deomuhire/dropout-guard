import os
import smtplib
import ssl
from email.message import EmailMessage


def send_password_reset_email(params):
    smtp_host = params.get('smtp_host')
    smtp_port = params.get('smtp_port')
    smtp_user = params.get('smtp_user')
    smtp_password = params.get('smtp_password')
    email_from = params.get('email_from')
    to_email = params.get('to_email')
    reset_link = params.get('reset_link')
    username = params.get('username')

    if not all([smtp_host, smtp_port, smtp_user, smtp_password, email_from]):
        raise RuntimeError('SMTP/email configuration is missing on the server.')

    msg = EmailMessage()
    msg['Subject'] = 'DropoutGuard - Password Reset'
    msg['From'] = email_from
    msg['To'] = to_email

    greet = f"Hi {username}," if username else "Hi there,"

    msg.set_content(
        f"{greet}\n\n"
        f"You requested a password reset. Use the link below to set a new password:\n\n"
        f"{reset_link}\n\n"
        f"This link will expire soon. If you did not request this, you can ignore this email." 
    )

    context = ssl.create_default_context()

    with smtplib.SMTP(smtp_host, int(smtp_port)) as server:
        server.starttls(context=context)
        server.login(smtp_user, smtp_password)
        server.send_message(msg)

