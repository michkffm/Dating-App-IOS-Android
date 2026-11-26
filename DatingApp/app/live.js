import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AppState, Platform, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { Button, styles } from "../src/experience";
import { api, ApiError, apiOrigin, LIVE_ENABLED } from "../src/live-api";
import { AccountLinks, AuthHeading, EmptyState, Field, LiveNavigation, LiveScreen, Message, Person, TextAction } from "../src/live-controls";
import { BirthdateField } from "../src/birthdate-field";
import { normalizeBirthdate } from "../src/birthdate.cjs";
import { isAccountToken, subscribeToAccountLinks } from "../src/account-actions.cjs";

const emptyAccount = { email: "", password: "", nickname: "", birthdate: "" };
const editing = (user) => ({ nickname: user.nickname, bio: user.bio || "" });
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 5 * 1024 * 1024;
const tabs = [["discover", "Entdecken", "compass-outline"], ["matches", "Matches", "heart-outline"], ["profile", "Mein Profil", "person-outline"]];

export default function Live() {
  const router = useRouter();
  const { mode } = useLocalSearchParams();
  const registerOnEntry = useRef(mode === "register");
  const [session, setSession] = useState(null);
  const [mediaReady, setMediaReady] = useState(false);
  const [accountEmail, setAccountEmail] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [registrationPilot, setRegistrationPilot] = useState(false);
  const [phase, setPhase] = useState("starting");
  const [pane, setPane] = useState("discover");
  const [account, setAccount] = useState(emptyAccount);
  const [registrationFeedback, setRegistrationFeedback] = useState("");
  const [profile, setProfile] = useState(null);
  const [people, setPeople] = useState([]);
  const [matches, setMatches] = useState([]);
  const [match, setMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [reason, setReason] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const initialAction = useRef(null);
  const emailCapability = useRef(undefined);
  const actionRevision = useRef(0);
  const [linkToken, setLinkToken] = useState("");
  const [typedToken, setTypedToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const token = session?.token;

  function resetSession() {
    setSession(null);
    setPhase("login");
    setPane("discover");
    setProfile(null);
    setPeople([]);
    setMatches([]);
    setMatch(null);
    setMessages([]);
    setDraft("");
    setConfirm(null);
    setReason("");
    setAccount(emptyAccount);
    setRegistrationFeedback("");
    setDeletePassword("");
    clearAccountAction();
  }

  function beginSession(user, nextToken) {
    setSession({ user, token: nextToken });
    setProfile(editing(user));
    setPhase("account");
    setAccount(emptyAccount);
    setRegistrationFeedback("");
    clearAccountAction();
  }

  function clearAccountAction() {
    if (initialAction.current) initialAction.current = null;
    setLinkToken("");
    setTypedToken("");
    setNewPassword("");
  }

  function changeAuth(next) {
    setRegistrationFeedback("");
    clearAccountAction();
    setError("");
    setNotice("");
    setPhase(next);
    setAccount((current) => ({ ...emptyAccount, email: current.email }));
  }

  function showAccountLink(entry) {
    actionRevision.current++;
    resetSession();
    setLinkToken(entry.token);
    setError(entry.token ? "" : "Der Link ist nicht vollständig. Bitte geben Sie den Code ein oder fordern Sie einen neuen Link an.");
    setNotice("");
    setPhase(entry.kind);
  }

  // The web entry consumes link fragments before Expo Router sees them.
  useLayoutEffect(() => {
    if (Platform.OS !== "web") return;
    return subscribeToAccountLinks((entry) => {
      if (emailCapability.current === true) showAccountLink(entry);
      else if (emailCapability.current === undefined) initialAction.current = entry;
    });
  }, []);

  useEffect(() => {
    if (!LIVE_ENABLED || apiOrigin() === null) return;
    const controller = new AbortController();
    const { signal } = controller;
    async function init() {
      let allowRegistration = false;
      try {
        const health = await api("/api/health", { signal });
        allowRegistration = health.registration === true || health.registrationPilot === true;
        if (!signal.aborted) {
          setRegistrationOpen(health.registration === true);
          setRegistrationPilot(health.registrationPilot === true);
        }
        if (signal.aborted) return;
        setMediaReady(health.media === true || ["ready", "configured", "available", "cloudinary"].includes(health.media));
        emailCapability.current = health.accountEmail === true;
        setAccountEmail(emailCapability.current);
        const entry = initialAction.current;
        initialAction.current = null;
        if (entry && emailCapability.current) {
          showAccountLink(entry);
          return;
        }
        const { user } = await api("/api/me", { signal });
        if (!signal.aborted && actionRevision.current === 0) beginSession(user);
      } catch (e) {
        if (signal.aborted || actionRevision.current !== 0) return;
        initialAction.current = null;
        if (e.status !== 401) setError(e.message);
        setPhase(registerOnEntry.current && allowRegistration && e.status === 401 ? "register" : "login");
      }
    }
    init();
    return () => controller.abort();
  }, []);

  // Poll only an open chat in the foreground; background tabs and apps do not
  // consume the hosted API and database allowance.
  useFocusEffect(React.useCallback(() => {
    if (!session || pane !== "chat" || !match) return;
    let pending = false;
    const controller = new AbortController();
    const page = Platform.OS === "web" && typeof document !== "undefined" ? document : null;
    const refresh = async () => {
      const foreground = page ? page.visibilityState !== "hidden" : !["inactive", "background"].includes(AppState.currentState);
      if (!foreground || pending || lock.current || controller.signal.aborted) return;
      pending = true;
      try {
        const result = await api("/api/matches/" + encodeURIComponent(match.id) + "/messages", { token, signal: controller.signal });
        if (!controller.signal.aborted && !lock.current) setMessages(result.messages);
      } catch (e) {
        if (!controller.signal.aborted && (e.status === 401 || e.status === 404)) {
          if (e.status === 401) resetSession();
          else { setPane("matches"); setMatch(null); setMatches([]); }
          setError(e.message);
        }
      } finally {
        pending = false;
      }
    };
    const interval = setInterval(refresh, 5000);
    const subscription = page ? null : AppState.addEventListener("change", (state) => { if (state === "active") void refresh(); });
    page?.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      clearInterval(interval);
      page?.removeEventListener("visibilitychange", refresh);
      subscription?.remove();
    };
  }, [session, pane, match, token]));

  useEffect(() => {
    if (!session || pane !== "discover") return;
    const controller = new AbortController();
    api("/api/discover", { token, signal: controller.signal })
      .then((response) => { if (!controller.signal.aborted) setPeople(response.profiles); })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e.status === 401) resetSession();
        setError(e.message);
      });
    return () => controller.abort();
  }, [session?.user.id, pane, token]);

  async function run(action, { auth = true } = {}) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      if (auth && e.status === 401) resetSession();
      setError(e instanceof ApiError ? e.message : "Die Aktion konnte nicht abgeschlossen werden. Bitte erneut versuchen.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  const request = (path, options) => api(path, { ...options, token });
  const post = (path, data) => request(path, { method: "POST", data });
  function openTab(key) {
    setConfirm(null);
    if (key === "matches") return run(async () => {
      setMatches((await request("/api/matches")).matches);
      setPane(key);
    });
    if (key === "discover" && pane === key) return run(async () => setPeople((await request("/api/discover")).profiles));
    if (key === "profile") setProfile(editing(session.user));
    setError("");
    setNotice("");
    setPane(key);
  }

  function submitAuth() {
    const register = phase === "register";
    const { email, password, nickname, birthdate } = account;
    const normalizedDate = register ? normalizeBirthdate(birthdate) : null;
    if (register) {
      const problem = !/^[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+$/.test(email.trim()) ? "Geben Sie eine gültige E-Mail-Adresse ein."
        : password.length < 12 ? "Das Passwort muss mindestens 12 Zeichen haben."
        : nickname.trim().length < 2 ? "Der Nickname muss mindestens 2 Zeichen haben."
        : !normalizedDate ? "Geben Sie ein gültiges Geburtsdatum ein, zum Beispiel 23.04.1998, oder wählen Sie eines im Kalender."
        : "";
      setRegistrationFeedback(problem);
      if (problem) return;
    }
    return run(async () => {
      const payload = register ? { email: email.trim(), password, nickname: nickname.trim(), birthdate: normalizedDate } : { email: email.trim(), password };
      let result;
      try {
        result = await api(register ? "/api/register" : "/api/login", { method: "POST", data: payload });
      } catch (e) {
        if (register && registrationPilot && e.status === 403) {
          setRegistrationFeedback("Für diesen Test ist nur die eingeladene E-Mail-Adresse freigeschaltet.");
          return;
        }
        if (register && e instanceof ApiError) {
          setRegistrationFeedback(e.message);
          return;
        }
        if (!register && accountEmail && e.status === 403) {
          changeAuth("check-email");
          setNotice("Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.");
          return;
        }
        throw e;
      }
      if (register && result.verificationRequired === true) {
        emailCapability.current = true;
        setAccountEmail(true);
        changeAuth("check-email");
        setNotice("Bestätigung angefordert. Wenn die Registrierung möglich ist, erhalten Sie einen Bestätigungslink per E-Mail.");
        return;
      }
      if (!result.user || (Platform.OS !== "web" && !result.token)) {
        throw new ApiError(0, "Der Server hat keine Sitzung eingerichtet.");
      }
      beginSession(result.user, result.token);
    }, { auth: false });
  }

  function requestAccountMail(kind) {
    const verification = kind === "verify";
    return run(async () => {
      await api(verification ? "/api/resend-verification" : "/api/forgot-password", {
        method: "POST", data: { email: account.email.trim() },
      });
      setNotice(verification
        ? "Wenn eine Bestätigung aussteht, erhalten Sie einen neuen Link per E-Mail."
        : "Wenn diese Adresse zu einem Konto gehört, erhalten Sie einen Link per E-Mail.");
    }, { auth: false });
  }

  function submitAccountAction(kind) {
    const value = linkToken || typedToken.trim();
    if (!isAccountToken(value)) return;
    return run(async () => {
      const verification = kind === "verify";
      try {
        await api(verification ? "/api/verify-email" : "/api/reset-password", {
          method: "POST",
          data: { token: value.toLowerCase(), password: newPassword },
        });
      } catch (e) {
        if ([400, 404, 410, 422].includes(e.status)) {
          setLinkToken("");
          setTypedToken("");
          throw new ApiError(e.status, "Der Link oder Code ist ungültig oder abgelaufen. Sie können einen neuen anfordern.");
        }
        if (verification && e.status === 401) throw new ApiError(401, "Das Passwort stimmt nicht mit der Registrierung überein.");
        throw e;
      }
      changeAuth("login");
      setNotice(verification
        ? "Ihre E-Mail-Adresse wurde bestätigt. Sie können sich jetzt anmelden."
        : "Ihr Passwort wurde geändert. Melden Sie sich mit dem neuen Passwort an.");
    }, { auth: false });
  }

  function decide(person, decision) {
    return run(async () => {
      const { matched } = await post("/api/decisions", { targetId: person.id, decision });
      setPeople((current) => current.filter((item) => item.id !== person.id));
      setNotice(matched ? "Sie haben ein Match!" : decision === "like" ? "Like gesendet." : "Profil übersprungen.");
    });
  }

  function openChat(item) {
    return run(async () => {
      const result = await request("/api/matches/" + encodeURIComponent(item.id) + "/messages");
      setMessages(result.messages);
      setMatch(item);
      setDraft("");
      setPane("chat");
    });
  }
  function sendChat() {
    return run(async () => {
      const { message } = await post("/api/matches/" + encodeURIComponent(match.id) + "/messages", { body: draft.trim() });
      setMessages((list) => list.some((item) => item.id === message.id) ? list : [...list, message]);
      setDraft("");
    });
  }
  function safety() {
    return run(async () => {
      const { action, person } = confirm;
      const data = { targetId: person.id };
      if (action === "report") data.reason = reason.trim();
      await post(action === "report" ? "/api/report" : "/api/block", data);
      if (action === "block") {
        setPeople((list) => list.filter((item) => item.id !== person.id));
        setMatches((list) => list.filter((item) => item.user.id !== person.id));
        if (match?.user.id === person.id) { setMatch(null); setPane("matches"); }
      }
      setConfirm(null);
      setReason("");
      setNotice(action === "report" ? "Meldung gesendet." : "Profil blockiert.");
    });
  }
  function saveProfile() {
    return run(async () => {
      const { user } = await request("/api/me", { method: "PATCH", data: { nickname: profile.nickname.trim(), bio: profile.bio.trim() } });
      setSession((previous) => ({ ...previous, user }));
      setProfile(editing(user));
      setNotice("Profil gespeichert.");
    });
  }
  function upload() {
    return run(async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], allowsMultipleSelection: false, quality: 0.85, exif: false,
        ...(Platform.OS === "ios" ? { preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible } : {}),
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) throw new ApiError(400, "Es wurde kein Bild ausgewählt.");
      const type = asset.mimeType || asset.file?.type;
      if (!acceptedTypes.has(type)) throw new ApiError(415, "Bitte wählen Sie ein JPEG-, PNG- oder WebP-Bild.");
      if ((asset.fileSize || asset.file?.size || 0) > maxImageBytes) throw new ApiError(413, "Bitte wählen Sie ein Bild bis 5 MB.");
      const bytes = Platform.OS === "web" ? new Uint8Array(await asset.file.arrayBuffer()) : await new File(asset.uri).bytes();
      if (bytes.byteLength === 0 || bytes.byteLength > maxImageBytes) throw new ApiError(413, "Bitte wählen Sie ein Bild bis 5 MB.");
      const { user } = await request("/api/photos", { method: "POST", raw: bytes, type });
      setSession((previous) => ({ ...previous, user }));
      setNotice("Profilfoto gespeichert.");
    });
  }
  function removeAccount() {
    return run(async () => {
      await request("/api/me", { method: "DELETE", data: { password: deletePassword } });
      resetSession();
      setNotice("Ihr Konto wurde gelöscht.");
    }, { auth: false });
  }

  const body = (text) => <Text style={styles.body}>{text}</Text>;
  const heading = (title) => <Text accessibilityRole="header" style={styles.title}>{title}</Text>;
  const actions = (person) => <>
    <Button label="Profil melden" secondary disabled={busy} onPress={() => { setReason(""); setConfirm({ action: "report", person }); }} />
    <Button label="Profil blockieren" secondary disabled={busy} onPress={() => setConfirm({ action: "block", person })} />
  </>;

  if (!LIVE_ENABLED || apiOrigin() === null) return (
    <LiveScreen>
      {heading("Kontozugang nicht verfügbar")}
      {body("Hier ist nur die lokale Demo eingerichtet. Es werden keine echten Konten oder Fotos verarbeitet.")}
      <Button label="Zur Demo" onPress={() => router.replace("/")} />
    </LiveScreen>
  );
  if (phase === "starting") return <LiveScreen busy>{heading("HeartPulse")}</LiveScreen>;
  if (!session) {
    const mailPhase = phase === "check-email" || phase === "forgot";
    const actionPhase = phase === "verify" || phase === "reset";
    if (accountEmail && mailPhase) {
      const verification = phase === "check-email";
      return (
        <LiveScreen busy={busy} error={error} notice={notice}>
          <AuthHeading title={verification ? "E-Mail-Adresse bestätigen" : "Passwort vergessen"} />
          <View style={styles.card}>
            {body(verification
              ? "Sobald die E-Mail ankommt, öffnen Sie den Link. Falls keine Nachricht ankommt, prüfen Sie auch den Spamordner oder fordern Sie den Link erneut an."
              : "Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen anzufordern.")}
            <Field label="E-Mail-Adresse" value={account.email} onChangeText={(email) => setAccount((current) => ({ ...current, email }))}
              keyboardType="email-address" autoCapitalize="none" autoComplete="email" maxLength={254} />
            <Button label={verification ? "Bestätigungslink erneut senden" : "Link zum Zurücksetzen anfordern"} disabled={busy || !account.email.trim()}
              onPress={() => requestAccountMail(verification ? "verify" : "reset")} />
            <AccountLinks>
              <TextAction label="Code eingeben" disabled={busy} onPress={() => changeAuth(verification ? "verify" : "reset")} />
            </AccountLinks>
          </View>
          <TextAction label="Zum Login" disabled={busy} onPress={() => changeAuth("login")} />
        </LiveScreen>
      );
    }
    if (accountEmail && actionPhase) {
      const verification = phase === "verify";
      return (
        <LiveScreen busy={busy} error={error} notice={notice}>
          <AuthHeading title={verification ? "E-Mail-Bestätigung abschließen" : "Neues Passwort setzen"} />
          <View style={styles.card}>
            {linkToken ? body("Der Code aus dem Link ist bereit.") : (
              <>
                {body("Öffnen Sie den Link aus der E-Mail im Browser oder kopieren Sie den 64-stelligen Code nach dem Gleichheitszeichen aus dem Link.")}
                <Field label="Code aus dem Link" value={typedToken} onChangeText={setTypedToken}
                  autoCapitalize="none" autoComplete="off" autoCorrect={false} secureTextEntry maxLength={64} />
              </>
            )}
            <Field label={verification ? "Passwort aus der Registrierung" : "Neues Passwort (mindestens 12 Zeichen)"} value={newPassword}
              onChangeText={setNewPassword} secureTextEntry autoComplete={verification ? "current-password" : "new-password"} maxLength={128} />
            <Button label={verification ? "E-Mail-Adresse jetzt bestätigen" : "Neues Passwort speichern"}
              disabled={busy || !isAccountToken(linkToken || typedToken.trim()) || newPassword.length < 12}
              onPress={() => submitAccountAction(phase)} />
            <AccountLinks>
              <TextAction label="Neuen Link anfordern" disabled={busy} onPress={() => changeAuth(verification ? "check-email" : "forgot")} />
            </AccountLinks>
          </View>
          <TextAction label="Zum Login" disabled={busy} onPress={() => changeAuth("login")} />
        </LiveScreen>
      );
    }
    const register = phase === "register";
    const on = (key) => (value) => {
      setAccount((current) => ({ ...current, [key]: value }));
      if (registrationFeedback) setRegistrationFeedback("");
    };
    const canSubmit = register || (!!account.email.trim() && !!account.password);
    return (
      <LiveScreen busy={busy} error={error} notice={notice}>
        <AuthHeading title={register ? "Konto erstellen" : "Bei HeartPulse anmelden"} />
        <View style={styles.card}>
          <Field label="E-Mail-Adresse" value={account.email} onChangeText={on("email")} keyboardType="email-address" autoCapitalize="none" autoComplete="email" maxLength={254} />
          <Field label="Passwort" value={account.password} onChangeText={on("password")} autoCapitalize="none" secureTextEntry autoComplete={register ? "new-password" : "current-password"} maxLength={128} />
          {register && <>
            {body("Mindestens 12 Zeichen für das Passwort.")}
            {registrationPilot && body("Die Registrierung ist derzeit nur mit einer eingeladenen E-Mail-Adresse möglich.")}
            <Field label="Nickname" value={account.nickname} onChangeText={on("nickname")} maxLength={24} />
            <BirthdateField value={account.birthdate} onChange={on("birthdate")} />
            {body("HeartPulse ist ab 18. Im Profil erscheint nur Ihr Alter, nicht Ihr Geburtsdatum.")}
          </>}
          {register && registrationFeedback ? <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.alert}>{registrationFeedback}</Text> : null}
          <Button label={register ? "Registrieren" : "Anmelden"} disabled={busy || !canSubmit} onPress={submitAuth} />
          {accountEmail && !register && <AccountLinks>
            <TextAction label="Passwort vergessen" disabled={busy} onPress={() => changeAuth("forgot")} />
          </AccountLinks>}
        </View>
        {(register || registrationOpen || registrationPilot) && (
          <TextAction label={register ? "Zum Login" : "Konto erstellen"} disabled={busy} onPress={() => changeAuth(register ? "login" : "register")} />
        )}
      </LiveScreen>
    );
  }

  const person = people[0];
  return (
    <LiveScreen busy={busy} error={error} notice={notice}>
      <LiveNavigation tabs={tabs} pane={pane} busy={busy} onSelect={openTab} />
      {!!confirm && (
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.heading}>
            {confirm.action === "delete" ? "Eigenes Konto löschen?" : confirm.action === "report" ? "Warum melden Sie dieses Profil?" : "Dieses Profil blockieren?"}
          </Text>
          {confirm.action === "delete" ? <>
            {body("Konto, Profil und Nachrichten werden entfernt. Das lässt sich nicht rückgängig machen.")}
            <Field label="Passwort zur Löschung" secureTextEntry autoComplete="current-password" value={deletePassword} onChangeText={setDeletePassword} maxLength={128} />
            <Button label="Konto endgültig löschen" disabled={busy || !deletePassword} onPress={removeAccount} />
          </> : <>
            {confirm.action === "report" && <Field label="Grund für die Meldung" multiline value={reason} onChangeText={setReason} maxLength={1000} />}
            {confirm.action === "block" && body("Sie können sich danach nicht mehr finden oder Nachrichten schreiben.")}
            <Button label={confirm.action === "report" ? "Meldung abschicken" : "Jetzt blockieren"} disabled={busy || (confirm.action === "report" && !reason.trim())} onPress={safety} />
          </>}
          <Button label="Abbrechen" secondary disabled={busy} onPress={() => { setConfirm(null); setDeletePassword(""); setReason(""); }} />
        </View>
      )}
      {pane === "discover" && <>
        {heading("Entdecken")}
        {person ? <Person person={person} token={token}>
          <Button label="Gefällt mir" disabled={busy || !!confirm} onPress={() => decide(person, "like")} />
          <Button label="Überspringen" secondary disabled={busy || !!confirm} onPress={() => decide(person, "pass")} />
          {!confirm && actions(person)}
        </Person> : <EmptyState icon="compass-outline" title="Gerade keine weiteren Profile" detail="Schauen Sie später wieder vorbei.">
          <Button label="Profile aktualisieren" secondary disabled={busy} onPress={() => openTab("discover")} />
        </EmptyState>}
      </>}
      {pane === "matches" && <>
        {heading("Matches")}
        {matches.length === 0 ? <EmptyState icon="heart-outline" title="Noch keine Matches" detail="Ein Match entsteht, wenn Sie sich gegenseitig liken.">
          <Button label="Profile entdecken" secondary disabled={busy} onPress={() => openTab("discover")} />
        </EmptyState> : matches.map((item) => <Person key={item.id} person={item.user} token={token} showImage={false}>
          <Button label={"Chat mit " + item.user.nickname} disabled={busy || !!confirm} onPress={() => openChat(item)} />
        </Person>)}
      </>}
      {pane === "chat" && match && <>
        {heading("Chat mit " + match.user.nickname)}
        {messages.length === 0 ? body("Noch keine Nachrichten.") : messages.map((message) => (
          <Message key={message.id} message={message.body} own={message.senderId === session.user.id}
            sender={message.senderId === session.user.id ? "Sie" : match.user.nickname}
            timestamp={Number.isNaN(Date.parse(message.createdAt)) ? null : new Date(message.createdAt).toLocaleString("de-DE")} />
        ))}
        <View style={styles.card}>
          <Field label="Nachricht" multiline value={draft} onChangeText={setDraft} maxLength={1000} />
          <Button label="Senden" disabled={busy || !!confirm || !draft.trim()} onPress={sendChat} />
        </View>
        {!confirm && actions(match.user)}
      </>}
      {pane === "profile" && profile && <>
        {heading("Mein Profil")}
        <Person person={session.user} token={token} />
        <View style={styles.card}>
          <Field label="Nickname" value={profile.nickname} onChangeText={(nickname) => setProfile((previous) => ({ ...previous, nickname }))} maxLength={24} />
          <Field label="Über mich" multiline value={profile.bio} onChangeText={(bio) => setProfile((previous) => ({ ...previous, bio }))} maxLength={500} />
          <Button label="Profil speichern" disabled={busy || !!confirm || !profile.nickname.trim()} onPress={saveProfile} />
          {mediaReady ? <Button label="Profilfoto auswählen" secondary disabled={busy || !!confirm} onPress={upload} /> : body("Foto-Uploads sind derzeit nicht verfügbar.")}
        </View>
        <Button label="Abmelden" secondary disabled={busy || !!confirm} onPress={() => run(async () => {
          await post("/api/logout");
          resetSession();
        })} />
        {!confirm && <Button label="Konto löschen" secondary disabled={busy} onPress={() => setConfirm({ action: "delete" })} />}
      </>}
    </LiveScreen>
  );
}
