import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { collection, doc, getDoc, limitToLast, onSnapshot, orderBy, query, serverTimestamp, setDoc, where, type DocumentData, type Firestore, type Unsubscribe } from "firebase/firestore";
import { CheckCircle2, MessageCircle, Plus, Search, Send, Users } from "lucide-react";
import { http } from "@/lib/http";
import { getFirebaseChat, isFirebaseChatConfigured } from "@/lib/firebaseChat";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/shared/Skeleton";
import { useI18n, useT } from "@/i18n/I18nProvider";
import { useAuth } from "@/state/AuthContext";

type Conversation = { id: string; participantIds: string[]; updatedAt: number; preview: string; senderId: string };
type Profile = { username: string; firstName: string; lastName: string; verified: boolean };
type ChatMessage = { id: string; senderId: string; text: string; createdAt: number };
type SearchUser = { id: number; username: string; wallet_address: string; verified: boolean };

function millis(value: unknown): number {
  return typeof value === "object" && value !== null && "toMillis" in value && typeof value.toMillis === "function"
    ? value.toMillis() : 0;
}

function displayName(profile: Profile | undefined, fallback: string): string {
  const full = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
  return full || (profile?.username ? `@${profile.username}` : fallback);
}

async function loadProfiles(db: Firestore, ids: string[]): Promise<Record<string, Profile>> {
  const rows = await Promise.all(ids.map(async (id) => {
    const snapshot = await getDoc(doc(db, "users", id));
    const data = snapshot.data();
    return [id, {
      username: typeof data?.username === "string" ? data.username : "",
      firstName: typeof data?.first_name === "string" ? data.first_name : "",
      lastName: typeof data?.last_name === "string" ? data.last_name : "",
      verified: data?.verified === true,
    }] as const;
  }));
  return Object.fromEntries(rows);
}

function parseConversation(snapshot: { id: string; data: () => DocumentData }): Conversation | null {
  const data = snapshot.data();
  if (data.kind !== "direct" || !Array.isArray(data.participant_ids)) return null;
  const last = data.last_message as Record<string, unknown> | undefined;
  return {
    id: snapshot.id,
    participantIds: data.participant_ids.filter((id: unknown): id is string => typeof id === "string"),
    updatedAt: millis(data.updated_at),
    preview: typeof last?.text === "string" ? last.text : "",
    senderId: typeof last?.sender_id === "string" ? last.sender_id : "",
  };
}

export function ChatsPage() {
  const t = useT();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user || !isFirebaseChatConfigured()) return;
    let cancelled = false;
    let unsubscribe: Unsubscribe | undefined;
    void getFirebaseChat(user.id).then(({ db, uid }) => {
      if (cancelled) return;
      unsubscribe = onSnapshot(query(collection(db, "conversations"), where("participant_ids", "array-contains", uid)), (snapshot) => {
        const rows = snapshot.docs.map(parseConversation).filter((item): item is Conversation => item !== null)
          .sort((a, b) => b.updatedAt - a.updatedAt);
        setConversations(rows);
        setLoading(false);
        setError(false);
        const otherIds = [...new Set(rows.flatMap(row => row.participantIds.filter(id => id !== uid)))];
        void loadProfiles(db, otherIds).then(result => { if (!cancelled) setProfiles(result); }).catch(() => undefined);
      }, () => { if (!cancelled) { setError(true); setLoading(false); } });
    }).catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; unsubscribe?.(); };
  }, [user?.id]);

  if (!isFirebaseChatConfigured()) return <main><TopBar title={t("broadcast.title")} /><ChatConfiguration /></main>;
  if (loading) return <main><TopBar title={t("broadcast.title")} /><div className="px-4 pt-4"><Skeleton className="h-20 w-full rounded-card" /></div></main>;
  if (error) return <main><TopBar title={t("broadcast.title")} /><ErrorState message={t("chat.loadError")} onRetry={() => window.location.reload()} /></main>;
  return <main><TopBar title={t("broadcast.title")} /><div className="space-y-3 px-4 pb-6 pt-3">
    <div className="flex gap-2 border-b border-app pb-3 text-body font-semibold"><span className="border-b-2 border-app-accent pb-3 text-app-primary">{t("chat.chats")}</span><Link to="/messages/updates" className="px-3 pb-3 text-app-secondary">{t("chat.updates")}</Link></div>
    <div className="flex items-center justify-between gap-3">
      <p className="text-body text-app-secondary">{t("chat.subtitle")}</p>
      <Button onClick={() => navigate("/messages/new")} className="shrink-0 px-4"><Plus className="h-4 w-4" />{t("chat.new")}</Button>
    </div>
    <button type="button" onClick={() => void openSupport(user?.id, navigate)} className="flex w-full items-center gap-3 rounded-card border border-app bg-app-surface p-4 text-start">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-app-accent-soft text-app-accent"><MessageCircle className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><span className="flex items-center gap-1 text-body font-semibold text-app-primary">{t("broadcast.support")}<CheckCircle2 className="h-4 w-4 text-app-accent" /></span><span className="block truncate text-label text-app-secondary">{t("chat.supportHint")}</span></span>
    </button>
    {conversations.length === 0 && <EmptyState icon={<Users className="h-7 w-7" />} message={t("chat.empty")} />}
    {conversations.map(conversation => {
      const other = conversation.participantIds.find(id => id !== String(user?.id)) ?? "";
      const profile = profiles[other];
      return <Link key={conversation.id} to={`/messages/${conversation.id}`} className="flex items-center gap-3 rounded-card bg-app-surface p-4 hover:bg-app-surface-soft">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-app-surface-soft text-app-primary"><MessageCircle className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1"><span className="flex items-center gap-1 text-body font-semibold text-app-primary">{displayName(profile, t("chat.user"))}{profile?.verified && <CheckCircle2 className="h-4 w-4 text-app-accent" />}</span><span className="block truncate text-label text-app-secondary">{conversation.preview || t("chat.startConversation")}</span></span>
      </Link>;
    })}
  </div></main>;
}

export function NewChatPage() {
  const t = useT();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const search = async (event: FormEvent) => {
    event.preventDefault();
    if (!term.trim()) return;
    setLoading(true); setError("");
    try { const response = await http.get<{ results: SearchUser[] }>("/api/messaging/users/search/", { q: term.trim() }); setResults(response.results); }
    catch { setError(t("chat.searchError")); }
    finally { setLoading(false); }
  };
  return <main><TopBar back title={t("chat.new")} /><div className="space-y-4 px-4"><form onSubmit={search} className="flex gap-2"><input value={term} onChange={event => setTerm(event.target.value)} placeholder={t("chat.search")} className="min-w-0 flex-1 rounded-chip bg-app-input px-4 py-3 text-body text-app-primary outline-none" /><Button type="submit" loading={loading} aria-label={t("chat.search")}><Search className="h-5 w-5" /></Button></form>{error && <p className="text-body text-app-danger">{error}</p>}{results.map(result => <button key={result.id} type="button" onClick={() => void startConversation(user?.id, result.id, navigate)} className="flex w-full items-center gap-3 rounded-card bg-app-surface p-4 text-start"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-app-surface-soft text-app-primary"><Users className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-1 text-body font-semibold text-app-primary">@{result.username}{result.verified && <CheckCircle2 className="h-4 w-4 text-app-accent" />}</span><span className="block truncate text-label text-app-secondary">{result.wallet_address}</span></span></button>)}</div></main>;
}

export function ChatRoomPage() {
  const t = useT(); const { user } = useAuth(); const { conversationId = "" } = useParams(); const { language } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]); const [conversation, setConversation] = useState<Conversation | null>(null); const [profile, setProfile] = useState<Profile>(); const [draft, setDraft] = useState(""); const [sending, setSending] = useState(false); const [error, setError] = useState(false);
  useEffect(() => {
    if (!user || !conversationId || !isFirebaseChatConfigured()) return;
    let cancelled = false; let stopConversation: Unsubscribe | undefined; let stopMessages: Unsubscribe | undefined;
    void getFirebaseChat(user.id).then(({ db, uid }) => {
      if (cancelled) return;
      stopConversation = onSnapshot(doc(db, "conversations", conversationId), snapshot => {
        if (!snapshot.exists()) { setError(true); return; }
        const current = parseConversation(snapshot); setConversation(current);
        const other = current?.participantIds.find(id => id !== uid);
        if (other) void loadProfiles(db, [other]).then(profiles => { if (!cancelled) setProfile(profiles[other]); });
      }, () => setError(true));
      stopMessages = onSnapshot(query(collection(db, "conversations", conversationId, "messages"), orderBy("created_at", "asc"), limitToLast(200)), snapshot => {
        setMessages(snapshot.docs.map(item => { const data = item.data(); return { id: item.id, senderId: typeof data.sender_id === "string" ? data.sender_id : "", text: typeof data.text === "string" ? data.text : "", createdAt: millis(data.created_at) }; }));
      }, () => setError(true));
    }).catch(() => setError(true));
    return () => { cancelled = true; stopConversation?.(); stopMessages?.(); };
  }, [conversationId, user?.id]);
  const send = async (event: FormEvent) => {
    event.preventDefault(); if (!user || !conversation || !draft.trim() || sending) return;
    setSending(true); const text = draft.trim(); setDraft("");
    try { const { db, uid } = await getFirebaseChat(user.id); const message = doc(collection(db, "conversations", conversation.id, "messages")); await setDoc(message, { sender_id: uid, kind: "text", text, created_at: serverTimestamp() }); await setDoc(doc(db, "conversations", conversation.id), { updated_at: serverTimestamp(), last_message: { sender_id: uid, kind: "text", text: text.slice(0, 140), created_at: serverTimestamp() } }, { merge: true }); const recipientIds = conversation.participantIds.map(Number).filter(id => Number.isInteger(id) && String(id) !== uid); void http.post("/api/messaging/messages/notify/", { conversation_id: conversation.id, message_id: message.id, recipient_ids: recipientIds, preview: text.slice(0, 140) }); }
    catch { setDraft(text); setError(true); } finally { setSending(false); }
  };
  if (!isFirebaseChatConfigured()) return <ChatConfiguration />;
  const name = displayName(profile, t("chat.user"));
  return <main className="flex min-h-[calc(100vh-6rem)] flex-col"><TopBar back title={name} /><div className="flex flex-1 flex-col gap-3 px-4 pb-4">{error && <ErrorState message={t("chat.roomError")} />}{messages.map(message => <div key={message.id} className={`max-w-[80%] rounded-card px-4 py-3 text-body ${message.senderId === String(user?.id) ? "self-end bg-app-action text-app-on-action" : "self-start bg-app-surface text-app-primary"}`}><p className="whitespace-pre-wrap break-words">{message.text}</p>{message.createdAt > 0 && <time className="mt-1 block text-caption opacity-70">{new Intl.DateTimeFormat(language === "ar" ? "ar" : "en", { timeStyle: "short" }).format(new Date(message.createdAt))}</time>}</div>)}<form onSubmit={send} className="sticky bottom-0 mt-auto flex gap-2 border-t border-app bg-app-background py-3"><input value={draft} onChange={event => setDraft(event.target.value)} placeholder={t("chat.write")} className="min-w-0 flex-1 rounded-chip bg-app-input px-4 py-3 text-body text-app-primary outline-none" /><Button type="submit" loading={sending} disabled={!draft.trim()} aria-label={t("chat.send")}><Send className="h-5 w-5" /></Button></form></div></main>;
}

function ChatConfiguration() { const t = useT(); return <ErrorState message={t("chat.notConfigured")} />; }
async function startConversation(userId: number | undefined, otherId: number, navigate: ReturnType<typeof useNavigate>) { if (!userId) return; const { conversation_id, participant_ids } = await http.post<{ conversation_id: string; participant_ids: string[] }>("/api/messaging/conversations/direct/start/", { other_user_id: otherId }); const { db, uid } = await getFirebaseChat(userId); const participants = Object.fromEntries(participant_ids.map(id => [id, { role: "member", joined_at: serverTimestamp() }])); await setDoc(doc(db, "conversations", conversation_id), { kind: "direct", title: null, created_by: uid, created_at: serverTimestamp(), updated_at: serverTimestamp(), participant_ids, participants }, { merge: true }); navigate(`/messages/${conversation_id}`); }
async function openSupport(userId: number | undefined, navigate: ReturnType<typeof useNavigate>) { if (!userId) return; const support = await http.get<{ user_id: number }>("/api/messaging/support/"); await startConversation(userId, support.user_id, navigate); }
