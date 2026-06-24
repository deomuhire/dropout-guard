# TODO - Forgot Password (Render)

- [ ] Add backend email delivery (SMTP) for `/api/auth/forgot-password`
- [ ] Implement password reset token generation + storage + expiration
- [ ] Add backend reset endpoint (verify token + set new password)
- [ ] Add frontend reset password page (read token + submit new password)
- [ ] Wire frontend route for reset page (if missing)
- [ ] Add Render env vars for SMTP + email from
- [ ] Test locally: request reset link + reset password

