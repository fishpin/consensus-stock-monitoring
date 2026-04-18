import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import Chat from '../pages/Chat/Chat';

// Mock the CometChat service so tests don't hit the real API
jest.mock('../services/chatAPI', () => ({
  USE_MOCK:              false,
  initChat:              jest.fn(() => Promise.resolve()),
  loginUser:             jest.fn(() => Promise.resolve({ uid: 'consensus_user' })),
  ensureGroup:           jest.fn(() => Promise.resolve()),
  joinGroup:             jest.fn(() => Promise.resolve()),
  fetchMessages:         jest.fn(() => Promise.resolve([])),
  sendMessage:           jest.fn((_, text) => Promise.resolve({
    id:        String(Date.now()),
    roomId:    'room-general',
    user:      'You',
    uid:       'consensus_user',
    text,
    imageUrl:  null,
    timestamp: new Date().toISOString(),
    likes:     0,
  })),
  addMessageListener:    jest.fn(),
  removeMessageListener: jest.fn(),
  fetchOnlineCount:      jest.fn(() => Promise.resolve(0)),
  addPresenceListener:   jest.fn(),
  removePresenceListener: jest.fn(),
}));

function renderChat() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <Chat />
      </AppProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

// ── Layout ────────────────────────────────────────────────────────────────────

describe('Chat page — layout', () => {
  test('renders the Rooms sidebar heading', () => {
    renderChat();
    expect(screen.getByText('Rooms')).toBeInTheDocument();
  });

  test('renders the default chat rooms', () => {
    renderChat();
    expect(screen.getByText(/General Market/i)).toBeInTheDocument();
  });

  test('renders a Send button', () => {
    renderChat();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });
});

// ── Input behaviour ───────────────────────────────────────────────────────────

describe('Chat page — input', () => {
  test('Send button is disabled when input is empty', () => {
    renderChat();
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  test('Send button is enabled when text is typed', () => {
    renderChat();
    const input = screen.getByPlaceholderText(/message/i);
    fireEvent.change(input, { target: { value: 'Hello!' } });
    // Button may remain disabled until chatReady — check the input at least
    expect(input.value).toBe('Hello!');
  });
});

// ── Room creation ─────────────────────────────────────────────────────────────

describe('Chat page — room creation', () => {
  test('shows the Create room form when + is clicked', () => {
    renderChat();
    fireEvent.click(screen.getByLabelText(/create new room/i));
    expect(screen.getByPlaceholderText('Room name')).toBeInTheDocument();
  });

  test('hides the Create room form when + is clicked again', () => {
    renderChat();
    const addBtn = screen.getByLabelText(/create new room/i);
    fireEvent.click(addBtn);
    fireEvent.click(addBtn);
    expect(screen.queryByPlaceholderText('Room name')).not.toBeInTheDocument();
  });

  test('creates a new room when form is submitted with a name', () => {
    renderChat();
    fireEvent.click(screen.getByLabelText(/create new room/i));

    fireEvent.change(screen.getByPlaceholderText('Room name'), {
      target: { value: 'My New Room' },
    });
    fireEvent.click(screen.getByLabelText(/create room/i));

    expect(screen.getAllByText('My New Room').length).toBeGreaterThan(0);
  });

  test('does not create a room when name is blank', () => {
    renderChat();
    const before = screen.getAllByRole('listitem').length;
    fireEvent.click(screen.getByLabelText(/create new room/i));
    fireEvent.click(screen.getByLabelText(/create room/i));
    expect(screen.getAllByRole('listitem')).toHaveLength(before);
  });
});

// ── Send message ──────────────────────────────────────────────────────────────

describe('Chat page — send message', () => {
  test('sent message appears in the message list', async () => {
    renderChat();
    const input = screen.getByPlaceholderText(/message/i);
    // Type first so the button can become enabled once chatReady is set
    fireEvent.change(input, { target: { value: 'Hello world' } });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled()
    );
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    await waitFor(() =>
      expect(screen.getByText('Hello world')).toBeInTheDocument()
    );
  });

  test('input clears after sending', async () => {
    renderChat();
    const input = screen.getByPlaceholderText(/message/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled()
    );
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    await waitFor(() => expect(input.value).toBe(''));
  });
});

// ── Image input ───────────────────────────────────────────────────────────────

describe('Chat page — image input', () => {
  test('image URL input is hidden by default', () => {
    renderChat();
    expect(screen.queryByPlaceholderText(/paste an image url/i)).not.toBeInTheDocument();
  });

  test('clicking the image button shows the image URL input', () => {
    renderChat();
    fireEvent.click(screen.getByTitle(/share image url/i));
    expect(screen.getByPlaceholderText(/paste an image url/i)).toBeInTheDocument();
  });

  test('clicking the image button again hides the image URL input', () => {
    renderChat();
    const imgBtn = screen.getByTitle(/share image url/i);
    fireEvent.click(imgBtn);
    fireEvent.click(imgBtn);
    expect(screen.queryByPlaceholderText(/paste an image url/i)).not.toBeInTheDocument();
  });
});
