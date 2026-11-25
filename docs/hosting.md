# HeartPulse hosting and operations

The current web app runs on one free Render Docker service in Frankfurt. It uses Neon PostgreSQL, Cloudinary for protected photos, and Resend for transactional email. Public registration is closed. The Blueprint creates only the web service.
It does not create a database, a disk, a worker, a scheduled job or any paid resource.
Review every provider's billing settings and usage before committing to live operation.
Do not activate a trial or paid add-on. Restrict the initial rollout; unlimited users and
continuous responsiveness cannot be promised at 0 €.

| Component | Candidate | Notes |
| --- | --- | --- |
| Web + API | [Render Free](https://render.com/docs/free) | One HTTPS origin. Service sleeps after idle time and can be slow to wake. |
| Database | [Neon Free PostgreSQL](https://neon.com/pricing) | Choose an EU region near Frankfurt. Do not use Render's time-limited free DB. Use a separate HeartPulse DB login and a certificate-verified URL with `sslmode=verify-full`. |
| Account mail | [Resend Free](https://resend.com/pricing) | Use HTTPS, not SMTP: [Render blocks common SMTP ports on Free](https://render.com/articles/can-i-send-email-over-smtp-from-render). Configure an owned, verified sender domain, disable email open/click tracking, and verify links are not rewritten. A new domain is not included in the free stack. |
| Photos | [Cloudinary Free](https://cloudinary.com/pricing) | Use a new credential only. Verify authenticated delivery and deletion in the actual account; track the shared storage/delivery/processing quota. |

## Release checks

1. Create the data and media resources in the correct accounts. Keep all values out of Git.
   Create the Render service from `render.yaml` using **Free** and confirm the assigned HTTPS URL.
2. The Blueprint initially requests only `DATABASE_URL`. Render supplies its service URL automatically;
   an owned domain, sender credentials and Cloudinary credentials are optional during the first deployment.
   Registration stays closed. To test real photos and account mail, add a new Cloudinary key, the Resend
   API key and a verified `MAIL_FROM` in Render's protected environment. Only override `APP_ORIGINS`
   and `PUBLIC_APP_ORIGIN` if you are intentionally using a different, authorized HTTPS origin.
3. Verify `/healthz` (process health) and `/api/health` (real DB and configured capabilities).
   The platform health check must not ping the database directly every few seconds.
4. In a controlled environment, test with authorized test inboxes, two synthetic profiles and
   a harmless test image. Verify real delivery, password reset/session revocation, signed private
   media, account deletion and image cleanup, blocked access, and iOS and Android device flows.
   For a supervised pilot keep `REGISTRATION_ENABLED=false`. Allow only operator-approved test inboxes via
   the protected Render variable `REGISTRATION_TEST_EMAILS` (up to ten, comma-separated).
   Do not turn on public registration until the operator has reviewed the measures and the real send and photo tests pass.
   Remove the pilot allowlist when it is no longer needed.
5. Keep registration closed if quotas or privacy checks fail. The app reserves a persistent
   daily email budget (up to 90 per day when using Resend) before it requests provider delivery.
   Configure provider-side usage alerts and review processing agreements, backups and moderation
   before inviting real users. Digital distribution through native app stores is not included.

The Blueprint does not provision or modify the external providers.

### Using an existing Resend sending domain

If your team already has a verified [Resend sending domain](https://resend.com/docs/dashboard/domains/introduction), use a dedicated HeartPulse sender address on that domain in `MAIL_FROM`, and a sending-only key scoped to the domain if available, stored in `RESEND_API_KEY`. Leave `BREVO_API_KEY` and `SMTP_URL` unset. Do not transfer or reconfigure a domain used by other apps. The production server rejects the `resend.dev` test sender. Keep any account-wide billing and DNS settings as they are, confirm remaining shared quota, and verify with explicitly approved pilot inboxes before public signup.


### Privacy and moderation

- Public profile responses omit email addresses, dates of birth and credentials. Photos are re-encoded without metadata, with an access check before server-side cloud delivery. Account deletion queues provider-side photo removal.
- Web sessions use host-only Secure, HttpOnly cookies with SameSite enabled. Confirmation and reset tokens are hashed and expire. A password reset invalidates old sessions.
- Authorized operators can review reports from the server directory with `npm run moderate -- queue` and record a decision with `dismiss REPORT_ID` or `suspend REPORT_ID --confirm`. There is no public moderation API. Never paste report output into GitHub issues, public logs, or chat.
- Store credentials only in protected service configuration. Disable previously exposed keys at the provider rather than relying on their removal from current code.
