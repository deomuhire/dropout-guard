import os
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv('DATABASE_URL', 'postgresql://localhost/dropout_db')

# Fix for Render: replace postgres:// with postgresql://
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

class Config:
    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours

    # SMTP settings (Render env vars)
    SMTP_HOST = os.getenv('SMTP_HOST')
    SMTP_PORT = os.getenv('SMTP_PORT', '587')
    SMTP_USER = os.getenv('SMTP_USER')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
    EMAIL_FROM = os.getenv('EMAIL_FROM')

