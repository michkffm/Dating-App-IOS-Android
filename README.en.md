# HeartPulse

[Deutsch](README.md) · [GitHub](https://github.com/michkffm/Dating-App-IOS-Android)

HeartPulse is a dating app for iOS, Android and the web. It combines an Expo frontend, a Node.js API and PostgreSQL. Features include account registration, sign-in, profiles, likes, mutual matches, chat, reporting, blocking and account deletion. A server-side Cloudinary adapter handles photos.

## Collaborative Project

**Pacome Adoufack Tsamo** developed and designed HeartPulse. Pacome and I worked together on HeartPulse.

[![Pacome on GitHub](docs/icons/github.svg)](https://github.com/Pacome-Adoufack)
[![Pacome on LinkedIn](docs/icons/linkedin.svg)](https://www.linkedin.com/in/pacome-adoufack-tsamo-8a2972317/)

## Local development

Use Node.js 24 and npm.

```sh
cd DatingApp
npm ci
EXPO_PUBLIC_LIVE_ENABLED=true npm run build:web
cd ../server
npm ci
HEARTPULSE_WEB_DIR=../DatingApp/dist npm start
```

Visit `http://127.0.0.1:3407`. This isolates the API and web frontend on one origin with persistent embedded PostgreSQL. Use only fictional accounts in development. Native clients require a compatible Expo development build and an API origin configured through `EXPO_PUBLIC_API_ORIGIN`.

```sh
(cd DatingApp && npm test)
(cd server && npm test)
```

## Privacy and release status

The API never includes a user's email or birth date in other people's profile responses. Browser sessions use an HttpOnly cookie. Cloudinary credentials stay on the server. Photos are re-encoded without metadata and served only after an API access check. Regenerate previously exposed credentials; never store real values in Git.

Not publicly deployed. Account email verification, password recovery, and moderation tooling were tested locally with fictional data. Public registration is off by default. Before enabling it, verify transactional mail, hosted PostgreSQL, Cloudinary, and real iOS/Android devices, and assign an operator to review reports.

Set `SMTP_URL`, `MAIL_FROM`, and `PUBLIC_APP_ORIGIN` for account email. Production requires HTTPS for account links and TLS for SMTP. Password recovery revokes existing sessions. Authorized operators can run `npm run moderate -- queue` from the server directory; report data is private and should not be copied to public logs or issues.

## Author

Michael Koch
