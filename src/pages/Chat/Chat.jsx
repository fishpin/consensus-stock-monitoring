import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Heart, Image, Plus, Check, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  initChat,
  loginUser,
  ensureGroup,
  joinGroup,
  fetchMessages,
  sendMessage,
  addMessageListener,
  removeMessageListener,
  fetchOnlineCount,
  addPresenceListener,
  removePresenceListener,
  USE_MOCK,
} from '../../services/chatAPI';
import styles from './Chat.module.css';

// The uid must be alphanumeric — no spaces or special chars
const CURRENT_UID        = 'consensus_user';
const CURRENT_NAME       = 'You';
const LISTENER_ID        = 'consensus-chat-listener';
const PRESENCE_LISTENER_ID = 'consensus-presence-listener';

export default function Chat() {
  const { chatRooms, createChatRoom } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialRoom = searchParams.get('room') || chatRooms[0]?.id;
  const [activeRoomId, setActiveRoomId]   = useState(initialRoom);
  const [messagesByRoom, setMessagesByRoom] = useState({});
  const [chatReady, setChatReady]         = useState(false);
  const [chatError, setChatError]         = useState(null);

  const [onlineCount,    setOnlineCount]    = useState(0);
  const [hasMore,        setHasMore]        = useState({});
  const [loadingMore,    setLoadingMore]    = useState(false);

  const [inputText, setInputText]           = useState('');
  const [imageUrl, setImageUrl]             = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [showNewRoom, setShowNewRoom]       = useState(false);
  const [newRoomName, setNewRoomName]       = useState('');
  const [newRoomTopic, setNewRoomTopic]     = useState('');
  const [sending, setSending]               = useState(false);

  const messagesEndRef = useRef(null);
  const activeRoom     = chatRooms.find((r) => r.id === activeRoomId);
  const messages       = messagesByRoom[activeRoomId] ?? [];

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Sync room from URL ────────────────────────────────────────────────────
  useEffect(() => {
    const room = searchParams.get('room');
    if (room) setActiveRoomId(room);
  }, [searchParams]);

  // ── Init CometChat once ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        await initChat();
        await loginUser(CURRENT_UID);
        if (!cancelled) setChatReady(true);
      } catch (err) {
        console.error('[CometChat] init/login failed:', err);
        const msg = err?.message || err?.details || JSON.stringify(err);
        if (!cancelled) setChatError(`Chat unavailable: ${msg}`);
      }
    }

    setup();
    return () => { cancelled = true; };
  }, []);

  // ── Load history + join group whenever room or readiness changes ──────────
  useEffect(() => {
    if (!chatReady || !activeRoomId) return;

    const room = chatRooms.find((r) => r.id === activeRoomId);
    const groupName = room?.name ?? activeRoomId;

    async function loadRoom() {
      try {
        await ensureGroup(activeRoomId, groupName);
        await joinGroup(activeRoomId);
        const history = await fetchMessages(activeRoomId);
        setMessagesByRoom((prev) => ({ ...prev, [activeRoomId]: history }));
        setHasMore((prev) => ({ ...prev, [activeRoomId]: history.length === 50 }));
      } catch (err) {
        console.error('[CometChat] loadRoom failed:', err);
      }
    }

    loadRoom();
  }, [chatReady, activeRoomId, chatRooms]);

  // ── Real-time listener ────────────────────────────────────────────────────
  useEffect(() => {
    if (!chatReady) return;

    addMessageListener(LISTENER_ID, (msg) => {
      // Only append if message belongs to the room AND wasn't sent by us
      // (CometChat echoes our own messages via the listener too)
      setMessagesByRoom((prev) => {
        const roomMsgs = prev[msg.roomId] ?? [];
        const alreadyPresent = roomMsgs.some((m) => m.id === msg.id);
        if (alreadyPresent) return prev;
        return { ...prev, [msg.roomId]: [...roomMsgs, msg] };
      });
    });

    return () => removeMessageListener(LISTENER_ID);
  }, [chatReady]);

  // ── Presence ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chatReady) return;
    fetchOnlineCount().then(setOnlineCount);
    addPresenceListener(PRESENCE_LISTENER_ID, (delta) =>
      setOnlineCount((n) => Math.max(0, n + delta))
    );
    return () => removePresenceListener(PRESENCE_LISTENER_ID);
  }, [chatReady]);

  // ── Load earlier ──────────────────────────────────────────────────────────
  async function handleLoadEarlier() {
    if (loadingMore || !messages.length) return;
    setLoadingMore(true);
    try {
      const earlier = await fetchMessages(activeRoomId, 50, messages[0].id);
      if (earlier.length === 0) {
        setHasMore((prev) => ({ ...prev, [activeRoomId]: false }));
      } else {
        setMessagesByRoom((prev) => ({
          ...prev,
          [activeRoomId]: [...earlier, ...(prev[activeRoomId] ?? [])],
        }));
        setHasMore((prev) => ({ ...prev, [activeRoomId]: earlier.length === 50 }));
      }
    } finally {
      setLoadingMore(false);
    }
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  async function handleSend(e) {
    e.preventDefault();
    const text  = inputText.trim();
    const image = imageUrl.trim();
    if ((!text && !image) || sending) return;

    setSending(true);
    try {
      const sent = await sendMessage(activeRoomId, text, imageUrl || null);
      // Override uid/user so it renders as "You"
      const asOwn = { ...sent, uid: CURRENT_UID, user: CURRENT_NAME };
      setMessagesByRoom((prev) => ({
        ...prev,
        [activeRoomId]: [...(prev[activeRoomId] ?? []), asOwn],
      }));
      setInputText('');
      setImageUrl('');
      setShowImageInput(false);
    } catch (err) {
      console.error('[CometChat] sendMessage failed:', err);
    } finally {
      setSending(false);
    }
  }

  // ── Like (local only — no CometChat reactions in free tier) ───────────────
  function handleLike(msgId) {
    setMessagesByRoom((prev) => ({
      ...prev,
      [activeRoomId]: (prev[activeRoomId] ?? []).map((m) =>
        m.id === msgId ? { ...m, likes: m.likes + 1 } : m
      ),
    }));
  }

  // ── Create room ───────────────────────────────────────────────────────────
  async function handleCreateRoom(e) {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    const id = `room-${newRoomName.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    createChatRoom({ id, symbol: null, name: newRoomName.trim(), topic: newRoomTopic.trim() });
    setMessagesByRoom((prev) => ({ ...prev, [id]: [] }));
    // Eagerly set; ensureGroup/joinGroup will run via the loadRoom effect
    setActiveRoomId(id);
    setNewRoomName('');
    setNewRoomTopic('');
    setShowNewRoom(false);
  }

  function selectRoom(id) {
    setActiveRoomId(id);
    setSearchParams({ room: id });
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.layout}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className="section-label">Rooms</h2>
          <button
            className="btn-icon"
            onClick={() => setShowNewRoom((v) => !v)}
            aria-label="Create new room"
          >
            <Plus size={16} />
          </button>
        </div>

        {showNewRoom && (
          <form className={styles.newRoomForm} onSubmit={handleCreateRoom}>
            <input
              className={styles.newRoomInput}
              placeholder="Room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              autoFocus
            />
            <input
              className={styles.newRoomInput}
              placeholder="Topic (optional)"
              value={newRoomTopic}
              onChange={(e) => setNewRoomTopic(e.target.value)}
            />
            <button type="submit" className="btn-icon" aria-label="Create room">
              <Check size={15} strokeWidth={2.5} />
            </button>
          </form>
        )}

        <ul className={styles.roomList}>
          {chatRooms.map((room) => (
            <li key={room.id}>
              <button
                className={`${styles.roomBtn} ${activeRoomId === room.id ? styles.roomBtnActive : ''}`}
                onClick={() => selectRoom(room.id)}
              >
                <span className={styles.roomName}>{room.name}</span>
                {(messagesByRoom[room.id]?.length ?? 0) > 0 && (
                  <span className={styles.msgCount}>
                    {messagesByRoom[room.id].length}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* ── Chat panel ──────────────────────────────────────────── */}
      <div className={styles.chatPanel}>

        {/* Room header */}
        <div className={styles.chatHeader}>
          <div>
            <h2 className="page-title">{activeRoom?.name}</h2>
            {activeRoom?.topic && (
              <p className={styles.roomTopic}>{activeRoom.topic}</p>
            )}
          </div>
          <span className={`${styles.onlineDot} ${chatReady ? styles.onlineDotLive : ''}`}>
            ● {!chatReady ? (chatError ? 'Offline' : 'Connecting…') : USE_MOCK ? 'Demo' : 'Live'}
            {chatReady && onlineCount > 0 && ` · ${onlineCount} online`}
          </span>
        </div>

        {/* Error banner */}
        {chatError && (
          <p className={styles.errorBanner}>{chatError}</p>
        )}

        {/* Messages */}
        <div className={styles.messages}>
          {hasMore[activeRoomId] && (
            <button
              className={styles.loadEarlier}
              onClick={handleLoadEarlier}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading…' : 'Load earlier messages'}
            </button>
          )}
          {messages.length === 0 && (
            <p className={styles.emptyMsg}>
              {chatReady ? 'No messages yet. Start the conversation!' : 'Connecting to chat…'}
            </p>
          )}
          {messages.map((msg) => {
            const isOwn = msg.uid === CURRENT_UID || msg.user === CURRENT_NAME;
            return (
              <div
                key={msg.id}
                className={`${styles.msgRow} ${isOwn ? styles.msgRowOwn : ''}`}
              >
                {!isOwn && (
                  <div className={styles.avatar}>
                    {msg.user.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={styles.bubble}>
                  <div className={styles.msgHeader}>
                    <span className={styles.msgUser}>{isOwn ? 'You' : msg.user}</span>
                    <span className={styles.msgTime}>{formatTime(msg.timestamp)}</span>
                  </div>
                  {msg.text && <p className={styles.msgText}>{msg.text}</p>}
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="shared"
                      className={styles.msgImage}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <button
                    className={`btn-icon ${styles.likeBtn}`}
                    onClick={() => handleLike(msg.id)}
                    aria-label="Like message"
                  >
                    <Heart size={11} />
                    {msg.likes > 0 && <span>{msg.likes}</span>}
                  </button>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form className={styles.inputArea} onSubmit={handleSend}>
          {showImageInput && (
            <input
              className={styles.imageInput}
              type="url"
              placeholder="Paste an image URL…"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          )}
          <div className={styles.inputRow}>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setShowImageInput((v) => !v)}
              title="Share image URL"
            >
              <Image size={16} />
            </button>
            <input
              className={styles.textInput}
              type="text"
              placeholder={`Message ${activeRoom?.name ?? ''}…`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!chatReady}
            />
            <button
              type="submit"
              className="btn-icon"
              disabled={(!inputText.trim() && !imageUrl.trim()) || !chatReady || sending}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
