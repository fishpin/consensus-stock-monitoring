import { CometChat } from '@cometchat/chat-sdk-javascript';
import { getMessagesByRoom } from '../data/mockChat';

const APP_ID   = import.meta.env.VITE_COMETCHAT_APP_ID;
const REGION   = import.meta.env.VITE_COMETCHAT_REGION;
const AUTH_KEY = import.meta.env.VITE_COMETCHAT_AUTH_KEY;

export const USE_MOCK = !APP_ID || APP_ID === 'demo' || !REGION || !AUTH_KEY;

let initialised = false;
let initPromise  = null;
let loginPromise = null;

// ── Init ────────────────────────────────────────────────────────────────────

export function initChat() {
  if (USE_MOCK) return Promise.resolve();
  if (initialised) return Promise.resolve();
  if (initPromise) return initPromise;
  initPromise = _doInit().finally(() => { initPromise = null; });
  return initPromise;
}

async function _doInit() {
  if (initialised) return;

  const settings = new CometChat.AppSettingsBuilder()
    .subscribePresenceForAllUsers()
    .setRegion(REGION)
    .autoEstablishSocketConnection(true)
    .build();

  await CometChat.init(APP_ID, settings);
  initialised = true;
}

// ── Auth ────────────────────────────────────────────────────────────────────

export function loginUser(uid) {
  if (USE_MOCK) return Promise.resolve({ uid, name: 'You' });
  if (loginPromise) return loginPromise;
  loginPromise = _doLogin(uid).finally(() => { loginPromise = null; });
  return loginPromise;
}

async function _doLogin(uid) {
  const existing = await CometChat.getLoggedinUser().catch(() => null);
  if (existing?.uid === uid) return existing;
  if (existing) await CometChat.logout().catch(() => null);

  try {
    return await CometChat.login(uid, AUTH_KEY);
  } catch (err) {
    if (err?.code === 'ERR_UID_NOT_FOUND') {
      const user = new CometChat.User(uid);
      user.setName('You');
      await CometChat.createUser(user, AUTH_KEY);
      return CometChat.login(uid, AUTH_KEY);
    }
    throw err;
  }
}

// ── Groups ──────────────────────────────────────────────────────────────────

export async function ensureGroup(groupId, groupName) {
  if (USE_MOCK) return;
  try {
    return await CometChat.getGroup(groupId);
  } catch {
    const group = new CometChat.Group(
      groupId,
      groupName,
      CometChat.GROUP_TYPE.PUBLIC,
      ''
    );
    return CometChat.createGroup(group);
  }
}

export async function joinGroup(groupId) {
  if (USE_MOCK) return;
  return CometChat.joinGroup(groupId, CometChat.GROUP_TYPE.PUBLIC, '').catch(
    (err) => {
      if (err?.code === 'ERR_ALREADY_JOINED') return;
      throw err;
    }
  );
}

// ── Messages ────────────────────────────────────────────────────────────────

export async function fetchMessages(groupId, limit = 50, beforeMessageId = null) {
  if (USE_MOCK) return getMessagesByRoom(groupId);

  const builder = new CometChat.MessagesRequestBuilder()
    .setGUID(groupId)
    .setLimit(limit);

  if (beforeMessageId) builder.setMessageId(parseInt(beforeMessageId, 10));

  const raw = await builder.build().fetchPrevious();
  return raw.map(toAppMessage);
}

export async function fetchOnlineCount() {
  if (USE_MOCK) return 12;
  try {
    const request = new CometChat.UsersRequestBuilder()
      .setLimit(100)
      .setStatus(CometChat.USER_STATUS.ONLINE)
      .build();
    const users = await request.fetchNext();
    return users.length;
  } catch {
    return 0;
  }
}

export function addPresenceListener(listenerId, onChange) {
  if (USE_MOCK) return;
  CometChat.addUserListener(
    listenerId,
    new CometChat.UserListener({
      onUserOnline:  () => onChange(+1),
      onUserOffline: () => onChange(-1),
    })
  );
}

export function removePresenceListener(listenerId) {
  if (USE_MOCK) return;
  CometChat.removeUserListener(listenerId);
}

export async function sendMessage(groupId, text, imageUrl = null) {
  if (USE_MOCK) {
    return {
      id:        `mock-${Date.now()}`,
      roomId:    groupId,
      user:      'You',
      uid:       'consensus_user',
      text,
      imageUrl,
      timestamp: new Date().toISOString(),
      likes:     0,
    };
  }

  if (imageUrl) {
    const msg = new CometChat.CustomMessage(
      groupId,
      CometChat.RECEIVER_TYPE.GROUP,
      'image_url',
      { imageUrl, text }
    );
    const sent = await CometChat.sendCustomMessage(msg);
    return toAppMessage(sent);
  }

  const msg = new CometChat.TextMessage(
    groupId,
    text,
    CometChat.RECEIVER_TYPE.GROUP
  );
  const sent = await CometChat.sendMessage(msg);
  return toAppMessage(sent);
}

// ── Real-time listener ───────────────────────────────────────────────────────

export function addMessageListener(listenerId, onMessage) {
  if (USE_MOCK) return;
  CometChat.addMessageListener(
    listenerId,
    new CometChat.MessageListener({
      onTextMessageReceived:   (msg) => onMessage(toAppMessage(msg)),
      onMediaMessageReceived:  (msg) => onMessage(toAppMessage(msg)),
      onCustomMessageReceived: (msg) => onMessage(toAppMessage(msg)),
    })
  );
}

export function removeMessageListener(listenerId) {
  if (USE_MOCK) return;
  CometChat.removeMessageListener(listenerId);
}

// ── Shape adapter ────────────────────────────────────────────────────────────

function toAppMessage(msg) {
  const isImageUrl = msg.type === 'custom' && msg.data?.customData?.imageUrl;
  return {
    id:        String(msg.id),
    roomId:    msg.receiverId,
    user:      msg.sender?.name ?? msg.sender?.uid ?? 'Unknown',
    uid:       msg.sender?.uid ?? '',
    text:      isImageUrl ? (msg.data.customData.text ?? '') : (msg.type === 'text' ? msg.text : ''),
    imageUrl:  isImageUrl ? msg.data.customData.imageUrl : (msg.type === 'image' ? msg.data?.url ?? null : null),
    timestamp: new Date(msg.sentAt * 1000).toISOString(),
    likes:     0,
  };
}
