# HeartPulse hosting (0 € target)

This configuration creates **one** free Render Docker web service (Frankfurt).
It does not create a database, a disk, a worker, a scheduled job or any paid resource.
Review every provider's billing settings and usage before committing to live operation.
Do not activate a trial or paid add-on. Restrict the initial rollout; unlimited users and
continuous responsiveness cannot be promised at 0 €.

| Component | Candidate | Notes |
| --- | --- | --- |
| Web + API | [Render Free](https://render.com/docs/free) | One HTTPS origin. Service sleeps after idle time and can be slow to wake. |
| Database | [Neon Free PostgreSQL](https://neon.com/pricing) | Choose an EU region near Frankfurt. Do not use Render's time-limited free DB. Use a separate HeartPulse DB login and a certificate-verified URL with `sslmode=verify-full`. |
| Account mail | [Brevo Free](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans) | Use HTTPS, not SMTP: [Render blocks common SMTP ports on Free](https://render.com/articles/can-i-send-email-over-smtp-from-render). Configure an owned, verified sender domain, disable email open/click tracking, and verify links are not rewritten. A new domain is not included in the free stack. |
| Photos | [Cloudinary Free](https://cloudinary.com/pricing) | Use a new credential only. Verify authenticated delivery and deletion in the actual account; track the shared storage/delivery/processing quota. |

## Release checks

1. Create the data and media resources in the correct accounts. Keep all values out of Git.
   Create the Render service from `render.yaml` using **Free** and confirm the assigned HTTPS URL.
2. The Blueprint initially requests only `DATABASE_URL`. Render supplies its service URL automatically;
   an owned domain, sender credentials and Cloudinary credentials are optional during the first deployment.
   Registration stays closed. To test real photos and account mail, add a new Cloudinary key, the Brevo
   API key and a verified `MAIL_FROM` in Render's protected environment. Only override `APP_ORIGINS`
   and `PUBLIC_APP_ORIGIN` if you are intentionally using a different, authorized HTTPS origin.
3. Verify `/healthz` (process health) and `/api/health` (real DB and configured capabilities).
   The platform health check must not ping the database directly every few seconds.
4. In a controlled environment, test with authorized test inboxes, two synthetic profiles and
   a harmless test image. Verify real delivery, password reset/session revocation, signed private
   media, account deletion and image cleanup, blocked access, and iOS and Android device flows.
   Do not turn on public registration until the operator has reviewed the measures.
5. Keep registration closed if quotas or privacy checks fail. The app reserves a persistent
   daily email budget (100 by default; 300 maximum) before it requests provider delivery.
   Configure provider-side usage alerts and review processing agreements, backups and moderation
   before inviting real users. Digital distribution through native app stores is not included.

No external provider was created or tested by this configuration alone.
