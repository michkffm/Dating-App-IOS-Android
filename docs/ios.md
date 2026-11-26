# HeartPulse im iOS-Simulator / HeartPulse in the iOS Simulator

<a id="ios-simulator"></a>
## Deutsch

Voraussetzungen: macOS, die vollständige Xcode-App mit installierter iOS-Simulatorlaufzeit, Node.js 24 und CocoaPods. Öffnen Sie zuerst einen **iPhone-Simulator**, nicht ein angeschlossenes iPhone.

Im Repository-Hauptordner:

```sh
cd DatingApp
npm ci
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
  npm run ios:simulator -- --device "iPhone 18 Pro"
```

Ersetzen Sie den Gerätenamen bei Bedarf durch den Namen oder die Geräte-ID Ihres **Simulators**. Wenn Xcode woanders liegt, passen Sie den Pfad an. Der Befehl erzeugt das Xcode-Projekt bei Bedarf, erstellt eine App mit eingebettetem JavaScript und startet sie ohne separaten Metro-Server. Für diesen Simulatorlauf ist kein Apple-Zertifikat nötig. Das ist keine App-Store-Datei. Für den echten Webdienst statt der lokalen Ansicht können Sie optional `EXPO_PUBLIC_LIVE_ENABLED=true` und `EXPO_PUBLIC_API_ORIGIN=https://heartpulse.onrender.com` in Ihrer nicht eingecheckten `DatingApp/.env.local` setzen und erneut bauen.

Für den Start über die Xcode-Oberfläche öffnen Sie danach `DatingApp/ios/HeartPulse.xcworkspace`, wählen den iPhone-Simulator und verwenden unter **Product → Scheme → Edit Scheme → Run** die Build-Konfiguration **Release**. Für **Debug** starten Sie zuvor Metro mit `npx expo start --localhost` aus `DatingApp`. Andernfalls kann die App das JavaScript-Bundle nicht laden.

<a id="ios-simulator-en"></a>
## English

Requirements: macOS, the full Xcode app with an installed iOS Simulator runtime, Node.js 24, and CocoaPods. Open an **iPhone simulator**, not an attached iPhone.

From the repository root:

```sh
cd DatingApp
npm ci
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
  npm run ios:simulator -- --device "iPhone 18 Pro"
```

Replace the device name with the name or device ID of your **simulator** if needed. Adjust the Xcode path if you installed it elsewhere. The command generates the Xcode project when needed and runs an app with bundled JavaScript, with no separate Metro server. No Apple certificate is needed for this simulator run. This is not an App Store build. To use the live service instead of the local experience, optionally set `EXPO_PUBLIC_LIVE_ENABLED=true` and `EXPO_PUBLIC_API_ORIGIN=https://heartpulse.onrender.com` in your untracked `DatingApp/.env.local`, then rebuild.

To run from the Xcode UI, open `DatingApp/ios/HeartPulse.xcworkspace`, select the iPhone simulator, and set **Product → Scheme → Edit Scheme → Run** to **Release**. To use **Debug**, start Metro first with `npx expo start --localhost` from `DatingApp`, or the app cannot load its JavaScript bundle.
