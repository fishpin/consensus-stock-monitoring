import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import {
  initChat,
  loginUser,
  ensureGroup,
  joinGroup,
  fetchMessages,
  sendMessage,
  addMessageListener,
  removeMessageListener,
  USE_MOCK,
} from '../../services/chatAPI';
import { MOCK_ROOMS } from '../../data/mockChat';
import styles from './StockChat.module.css';

const CURRENT_UID  = 'consensus_user';
const CURRENT_NAME = 'You';

export default function StockChat({ symbol }) {
  const roomId   = `room-${symbol}`;
  const roomName = MOCK_ROOMS.find((r) => r.id === roomId)?.name ?? `${symbol} — Discussion`;

  const [messages,  setMessages]  = useState([]);
  const [inputText, setInputText] = useState('');
  const [chatReady, setChatReady] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [sending,   setSending]   = useState(false);
  const messagesEndRef = useRef(null);
  const listenerId     = `stock-chat-listener-${symbol}`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        await initChat();
        await loginUser(CURRENT_UID);
        await ensureGroup(roomId, roomName);
        await joinGroup(roomId);
        const history = await fetchMessages(roomId);
        if (!cancelled) {
          setMessages(history);
          setChatReady(true);
        }
      } catch (err) {
        if (!cancelled) setChatError('Chat unavailable');
      }
    }

    setup();
    return () => { cancelled = true; };
  }, [roomId, roomName]);

  useEffect(() => {
    if (!chatReady) return;

    addMessageListener(listenerId, (msg) => {
      if (msg.roomId !== roomId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => removeMessageListener(listenerId);
  }, [chatReady, roomId, listenerId]);

  async function handleSend(e) {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const sent  = await sendMessage(roomId, text);
      const asOwn = { ...sent, uid: CURRENT_UID, user: CURRENT_NAME };
      setMessages((prev) => [...prev, asOwn]);
      setInputText('');
    } catch {
      // silent — user can retry
    } finally {
      setSending(false);
    }
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className={styles.widget}>

      <div className={styles.statusRow}>
        <span className={`${styles.dot} ${chatReady ? styles.dotLive : ''}`}>
          ● {!chatReady ? (chatError ?? 'Connecting…') : USE_MOCK ? 'Demo' : 'Live'}
        </span>
        <span className={styles.roomName}>{roomName}</span>
      </div>

      {chatError && <p className={styles.errorBanner}>{chatError}</p>}

      <div className={styles.messages}>
        {messages.length === 0 && (
          <p className={styles.empty}>
            {chatReady ? 'No messages yet — start the discussion!' : 'Connecting to chat…'}
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.uid === CURRENT_UID || msg.user === CURRENT_NAME;
          return (
            <div key={msg.id} className={`${styles.msgRow} ${isOwn ? styles.msgRowOwn : ''}`}>
              {!isOwn && (
                <div className={styles.avatar}>{msg.user.charAt(0).toUpperCase()}</div>
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
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.inputRow} onSubmit={handleSend}>
        <input
          className={styles.input}
          type="text"
          placeholder={chatReady ? `Message #${symbol}…` : 'Connecting…'}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={!chatReady}
        />
        <button
          type="submit"
          className="btn-icon"
          disabled={!inputText.trim() || !chatReady || sending}
          aria-label="Send message"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
