import React, { useEffect, useRef, useState } from "react";
import { Platform, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { Button, styles } from "../src/experience";
import { api, ApiError, apiOrigin, LIVE_ENABLED } from "../src/live-api";
import { Field, LiveScreen, Person } from "../src/live-controls";

const emptyAccount = { email: "", password: "", nickname: "", birthdate: "" };
const editing = (user) => ({ nickname: user.nickname, bio: user.bio || "" });
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 5 * 1024 * 1024;
const tabs = [["discover", "Entdecken"], ["matches", "Matches"], ["profile", "Mein Profil"]];

export default function Live() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [mediaReady, setMediaReady] = useState(false);
  const [phase, setPhase] = useState("starting");
  const [pane, setPane] = useState("discover");
  const [account, setAccount] = useState(emptyAccount);
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
    setDeletePassword("");
  }

  function beginSession(user, nextToken) {
    setSession({ user, token: nextToken });
    setProfile(editing(user));
    setPhase("account");
    setAccount(emptyAccount);
  }

  useEffect(() => {
    if (!LIVE_ENABLED || apiOrigin() === null) return;
    const controller = new AbortController();
    const { signal } = controller;
    async function init() {
      try {
        const health = await api("/api/health", { signal });
        if (signal.aborted) return;
        setMediaReady(health.media === true || ["ready", "configured", "available", "cloudinary"].includes(health.media));
        const { user } = await api("/api/me", { signal });
        if (!signal.aborted) beginSession(user);
      } catch (e) {
        if (signal.aborted) return;
        if (e.status !== 401) setError(e.message);
        setPhase("login");
      }
    }
    init();
    return () => controller.abort();
  }, []);

  // A focused chat refreshes automatically while it is open. Session loss
  // remains visible and does not send credentials to another origin.
  useFocusEffect(React.useCallback(() => {
    if (!session || pane !== "chat" || !match) return;
    let pending = false;
    const controller = new AbortController();
    const interval = setInterval(async () => {
      if (pending || lock.current) return;
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
    }, 5000);
    return () => { controller.abort(); clearInterval(interval); };
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
    return run(async () => {
      const { email, password, nickname, birthdate } = account;
      const payload = register ? { email: email.trim(), password, nickname: nickname.trim(), birthdate: birthdate.trim() } : { email: email.trim(), password };
      const result = await api(register ? "/api/register" : "/api/login", { method: "POST", data: payload });
      if (!result.user || (Platform.OS !== "web" && !result.token)) {
        throw new ApiError(0, "Der Server hat keine Sitzung eingerichtet.");
      }
      beginSession(result.user, result.token);
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
    const register = phase === "register";
    const on = (key) => (value) => setAccount((current) => ({ ...current, [key]: value }));
    const canSubmit = !!account.email.trim() && !!account.password && (!register
      || !!(account.nickname.trim() && /^\d{4}-\d{2}-\d{2}$/.test(account.birthdate.trim())));
    return (
      <LiveScreen busy={busy} error={error} notice={notice}>
        {heading(register ? "Konto erstellen" : "Bei HeartPulse anmelden")}
        <View style={styles.card}>
          <Field label="E-Mail-Adresse" value={account.email} onChangeText={on("email")} keyboardType="email-address" autoCapitalize="none" autoComplete="email" maxLength={254} />
          <Field label="Passwort" value={account.password} onChangeText={on("password")} autoCapitalize="none" secureTextEntry autoComplete={register ? "new-password" : "current-password"} maxLength={128} />
          {register && <>
            <Field label="Spitzname" value={account.nickname} onChangeText={on("nickname")} maxLength={24} />
            <Field label="Geburtsdatum (JJJJ-MM-TT)" value={account.birthdate} onChangeText={on("birthdate")} maxLength={10} placeholder="1998-04-23" />
            {body("HeartPulse ist ab 18. Im Profil erscheint nur Ihr Alter, nicht Ihr Geburtsdatum.")}
          </>}
          <Button label={register ? "Registrieren" : "Anmelden"} disabled={busy || !canSubmit} onPress={submitAuth} />
          <Button label={register ? "Zum Login" : "Konto erstellen"} secondary disabled={busy} onPress={() => {
            setError(""); setNotice(""); setPhase(register ? "login" : "register");
            setAccount((current) => ({ ...current, password: "" }));
          }} />
        </View>
      </LiveScreen>
    );
  }

  const person = people[0];
  return (
    <LiveScreen busy={busy} error={error} notice={notice}>
      <View accessibilityLabel="HeartPulse Navigation" style={styles.row}>
        {tabs.map(([key, label]) => <Button key={key} label={label} disabled={busy} secondary={pane !== key && !(key === "matches" && pane === "chat")} onPress={() => openTab(key)} />)}
      </View>
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
        </Person> : body("Gerade keine weiteren Profile. Tippen Sie auf Entdecken, um die Liste zu aktualisieren.")}
      </>}
      {pane === "matches" && <>
        {heading("Matches")}
        {matches.length === 0 ? body("Noch keine Matches.") : matches.map((item) => <Person key={item.id} person={item.user} token={token} showImage={false}>
          <Button label={"Chat mit " + item.user.nickname} disabled={busy || !!confirm} onPress={() => openChat(item)} />
        </Person>)}
      </>}
      {pane === "chat" && match && <>
        {heading("Chat mit " + match.user.nickname)}
        {messages.length === 0 ? body("Noch keine Nachrichten.") : messages.map((message) => (
          <View key={message.id} style={styles.card}>
            <Text style={styles.kicker}>{message.senderId === session.user.id ? "Sie" : match.user.nickname}</Text>
            {body(message.body)}
            {Number.isNaN(Date.parse(message.createdAt)) ? null : body(new Date(message.createdAt).toLocaleString("de-DE"))}
          </View>
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
          <Field label="Spitzname" value={profile.nickname} onChangeText={(nickname) => setProfile((previous) => ({ ...previous, nickname }))} maxLength={24} />
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
