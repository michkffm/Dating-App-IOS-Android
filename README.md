# HeartPulse

HeartPulse ist eine lokale Dating-App-Demo für iOS, Android und Web. Die Oberfläche bleibt beim ursprünglichen HeartPulse-Stil mit Violett, Herzsymbol und Profilkarten. Alle Beispielprofile sind frei erfunden.

## Lokal starten

```sh
cd DatingApp
npm ci
npm start
```

Im Expo-Menü öffnet `w` die Web-Demo. Für iOS und Android braucht es eine mit dem Projekt kompatible Test-App bzw. einen passenden Development Build. Das Projekt verwendet derzeit Expo SDK 52 und ist nicht für Store-Einreichungen freigegeben.

```sh
npm test
npx expo export --platform all
```

## Was funktioniert

- Beispielprofile ansehen, überspringen oder liken und simulierte Matches öffnen.
- Einen optionalen **erfundenen** Demo-Spitznamen wählen.
- Spitzname und Auswahl werden auf dem Testgerät bzw. im Browser gespeichert und lassen sich unter „Profil & Datenschutz“ löschen. Die Demo fordert keine personenbezogenen Angaben an. Bitte keine echten Namen oder sonstigen persönlichen Angaben eingeben.
- Kein Konto, Upload, Tracking, Chat mit echten Personen oder Zahlungsverkehr.

## Vor Hosting und echten Konten

1. Den im ursprünglichen Git-Stand exponierten Cloudinary-Schlüssel im Anbieter-Dashboard widerrufen oder rotieren und dessen Aktivität prüfen. Das Entfernen aus dem neuen Arbeitsstand löscht bestehende Kopien und die Git-Historie nicht.
2. Expo schrittweise aktualisieren und den Ablauf auf einem echten iOS- und Android-Gerät prüfen.
3. Profil, Matching und Chat an ein Backend mit Authentifizierung und objektbezogenen Zugriffsprüfungen anbinden. Die lokalen Beispieldaten nicht in echte Konten übernehmen.
4. Fotos erst nach Login mit kurzlebigen, serverseitig signierten Uploads und privaten Medienberechtigungen aktivieren. Anbieter-Secrets nur im Secret Store des Servers hinterlegen, nie im Client, in `EXPO_PUBLIC_*` oder in Git.
5. Melden, Blockieren, Moderation und Kontolöschung vor dem öffentlichen Start umsetzen und testen.

Es wurde noch kein Backend eingerichtet und nichts veröffentlicht.
