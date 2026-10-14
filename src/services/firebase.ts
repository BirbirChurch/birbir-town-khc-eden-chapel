import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  limit,
  Firestore
} from 'firebase/firestore';
import { LeadershipMessage } from '../types/chapel';

export const firebaseConfig = {
  apiKey: "AIzaSyB9ziWa-dc59SSfESc0rEn6Le0__XdtRUE",
  authDomain: "birbir-tow-khc-eden-chapel.firebaseapp.com",
  projectId: "birbir-tow-khc-eden-chapel",
  storageBucket: "birbir-tow-khc-eden-chapel.firebasestorage.app",
  messagingSenderId: "230789602685",
  appId: "1:230789602685:web:6157de5e26b095249e4014"
};

// Initialize Firebase safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let dbInstance: Firestore | null = null;
try {
  dbInstance = getFirestore(app);
} catch (e) {
  console.warn('Firestore initialization warning:', e);
}

export const db = dbInstance;

const LOCAL_STORAGE_MESSAGES_KEY = 'eden_leadership_messages_v1';

export function getLocalMessages(): LeadershipMessage[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalMessage(msg: LeadershipMessage): void {
  try {
    const msgs = getLocalMessages();
    const updated = [...msgs, msg];
    localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving local message:', e);
  }
}

/**
 * Subscribe to messages in a specific leadership channel.
 * Uses Firestore real-time onSnapshot with fallback to local messages.
 */
export function subscribeToChannelMessages(
  channelId: string,
  onUpdate: (messages: LeadershipMessage[]) => void
): () => void {
  // If Firestore is available, attempt real-time listener
  if (db) {
    try {
      const messagesRef = collection(db, 'leadership_messages');
      const q = query(
        messagesRef,
        where('channelId', '==', channelId),
        orderBy('createdAt', 'asc'),
        limit(100)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const remoteMsgs: LeadershipMessage[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            remoteMsgs.push({
              id: doc.id,
              channelId: data.channelId,
              senderName: data.senderName,
              senderRole: data.senderRole,
              senderPhone: data.senderPhone || '',
              message: data.message,
              timestamp: data.timestamp || new Date().toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit' }),
              createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()
            });
          });

          // Also include local messages for that channel if not already in remote
          const local = getLocalMessages().filter(m => m.channelId === channelId);
          const combined = [...remoteMsgs];
          local.forEach(loc => {
            if (!combined.some(r => r.id === loc.id || (r.message === loc.message && Math.abs((r.createdAt || 0) - (loc.createdAt || 0)) < 3000))) {
              combined.push(loc);
            }
          });
          combined.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
          onUpdate(combined);
        },
        (error) => {
          console.warn('Firestore subscription fallback to local storage:', error.message);
          // Fallback to local
          const local = getLocalMessages().filter(m => m.channelId === channelId);
          onUpdate(local);
        }
      );

      return unsubscribe;
    } catch (e) {
      console.warn('Failed to attach Firestore listener:', e);
    }
  }

  // Fallback purely local
  const local = getLocalMessages().filter(m => m.channelId === channelId);
  onUpdate(local);
  return () => {};
}

/**
 * Send a message to a leadership channel (posts to Firestore and saves locally).
 */
export async function sendChannelMessage(
  channelId: string,
  senderName: string,
  senderRole: string,
  message: string,
  senderPhone?: string
): Promise<LeadershipMessage> {
  const newMsg: LeadershipMessage = {
    id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    channelId,
    senderName,
    senderRole,
    senderPhone: senderPhone || '',
    message,
    timestamp: new Date().toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit' }) + ' · ዛሬ',
    createdAt: Date.now()
  };

  // Always save locally first for instantaneous responsiveness
  saveLocalMessage(newMsg);

  // Attempt to write to Firestore
  if (db) {
    try {
      await addDoc(collection(db, 'leadership_messages'), {
        channelId,
        senderName,
        senderRole,
        senderPhone: senderPhone || '',
        message,
        timestamp: newMsg.timestamp,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('Could not write to remote Firestore (saved locally):', e);
    }
  }

  return newMsg;
}
