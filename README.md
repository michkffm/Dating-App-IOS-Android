# HeartPulse

[HeartPulse öffnen](https://heartpulse.onrender.com) · [English](README.en.md) · [GitHub](https://github.com/michkffm/Dating-App-IOS-Android)

HeartPulse ist eine Dating-App für iOS, Android und Web. Sie verbindet ein Expo-Frontend mit einer Node.js-API und PostgreSQL. Dazu gehören Registrierung und Anmeldung, Profile, Likes, gegenseitige Matches, Chat und Kontolöschung. Nutzende können Profile melden oder sperren. Fotos werden über einen serverseitigen Cloudinary-Adapter verarbeitet.

## Live-Web-App

[![Die gehostete HeartPulse-Anmeldeseite](docs/heartpulse-login.png)](https://heartpulse.onrender.com)

Die Anmeldeseite ist öffentlich erreichbar. Die Registrierung neuer Konten ist derzeit geschlossen.

## Gemeinschaftsprojekt

**Pacome Adoufack Tsamo** hat HeartPulse entwickelt und gestaltet. Pacome und ich haben gemeinsam an HeartPulse gearbeitet.

[![Pacome auf GitHub](docs/icons/github.svg)](https://github.com/Pacome-Adoufack)
[![Pacome auf LinkedIn](docs/icons/linkedin.svg)](https://www.linkedin.com/in/pacome-adoufack-tsamo-8a2972317/)

## Voraussetzungen

- Node.js 24 und npm
- Für native Installationen: ein mit dem Expo SDK kompatibler Development Build
- Für eine Einrichtung außerhalb des Macs: PostgreSQL und ein eigener Cloudinary-Zugang eingerichtet über den Secret Store des Hosters

## Lokal entwickeln

```sh
cd DatingApp
npm ci
EXPO_PUBLIC_LIVE_ENABLED=true npm run build:web
cd ../server
npm ci
HEARTPULSE_WEB_DIR=../DatingApp/dist npm start
```

Die App ist unter `http://127.0.0.1:3407` erreichbar. Lokal nutzt der Server eingebettetes PostgreSQL (PGlite) und speichert Daten außerhalb von Git. Für die Entwicklung bitte ausschließlich fiktive Konten anlegen. Web und API laufen lokal unter derselben Adresse. Für native Entwicklung greifen die Apps über eine konfigurierte API-Adresse in `EXPO_PUBLIC_API_ORIGIN` zu. Der Modus mit Beispielprofilen bleibt für Offline-Tests verfügbar.

## Tests

```sh
(cd DatingApp && npm test)
(cd server && npm test)
```

Die API-Tests prüfen Anmeldung, Session-Schutz, gegenseitige Matches, Zugriff auf Chat und Fotos, Blockieren, Melden, Löschung und Persistenz. Die Medien-Tests prüfen die Dekodierung, Größenbegrenzung und Entfernung von Metadaten.

## Datenschutz und Betrieb

- E-Mail, Geburtsdatum und Sitzungsdaten erscheinen nicht in fremden Profilen. Das sichtbare Profil zeigt nur den Spitznamen, das Alter und die freigegebenen Profilfelder.
- Der Server signiert Cloudinary-Zugriffe. Hochgeladene Fotos werden neu kodiert; Originale, Metadaten und Anbieter-Schlüssel landen nicht im Client. Nicht angemeldete und gegenseitig blockierte Profile erhalten keine Bilder. Fotos gelöschter Konten werden zur Entfernung beim Anbieter vorgemerkt.
- Web-Sitzungen verwenden ein HttpOnly-Cookie. Die API prüft den Ursprung mutierender Anfragen, begrenzt sensible Zugriffe und speichert nur gehashte Sitzungstoken.
- Echte Zugangsdaten gehören in den Secret Store des Hosters. Die bisher veröffentlichten Schlüssel müssen in Cloudinary widerrufen werden; nicht für Produktion wiederverwenden.

**Freigabe:** Die Web-App ist auf Render erreichbar; die Registrierung neuer Konten ist geschlossen. Kontobestätigung, Passwort-Wiederherstellung und die Meldungsbearbeitung wurden lokal mit Testdaten geprüft. Vor der öffentlichen Registrierung müssen E-Mail-Versand, PostgreSQL und Cloudinary in der gehosteten Umgebung gemeinsam getestet werden. Dazu gehören echte iOS- und Android-Geräte und eine verantwortliche Person für Meldungen. Die Registrierung bleibt im Hosting standardmäßig aus.

## E-Mail und Moderation

- Für Bestätigung und Passwort-Wiederherstellung müssen `SMTP_URL`, `MAIL_FROM` und `PUBLIC_APP_ORIGIN` gesetzt sein. In Produktion liegt der Host der Links auf der freigegebenen HTTPS-Adresse und der Mailtransport nutzt TLS. Die Datenbank speichert nur Fingerabdrücke der zeitlich begrenzten Einmal-Codes. Ein Passwortwechsel beendet bestehende Sitzungen.
- Autorisierte Betreiber lesen Meldungen mit `npm run moderate -- queue` im Serverordner und schließen sie nach Prüfung mit `dismiss REPORT_ID` oder `suspend REPORT_ID --confirm` ab. Es gibt keinen öffentlich erreichbaren Admin-Endpunkt. Die Ausgabe enthält Meldungsdaten und gehört nicht in öffentliche Logs, Tickets oder Chats.

## Vorbereitung fürs Hosting

Das Dockerfile bündelt Web und API für den Betrieb auf demselben Ursprung.
Für einen Render-Webdienst ist `/api/health` als Healthcheck vorgesehen.
`APP_ORIGINS` muss exakt die freigegebene HTTPS-Adresse enthalten; der
PostgreSQL-Zugang und die neu ausgestellten Cloudinary-Schlüssel werden nur
als Secrets am Dienst hinterlegt. Der PostgreSQL-Endpunkt muss TLS mit Prüfung von Zertifikat und Hostname unterstützen (`sslmode=verify-full`). Der Container läuft auf Render. Die Produktion lässt öffentliche Registrierung
ohne konfigurierten E-Mail-Versand nicht zu. Auch nach der Einrichtung erst nach Freigabetest aktivieren.

## Autor

Michael Koch
