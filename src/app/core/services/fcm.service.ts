import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAhSc0EZl-Ah1Af_YErhOx_0hFdBs1BXOI",
  authDomain: "fcm-demo-b8977.firebaseapp.com",
  projectId: "fcm-demo-b8977",
  storageBucket: "fcm-demo-b8977.firebasestorage.app",
  messagingSenderId: "546938487296",
  appId: "1:546938487296:web:0b7cb06338df8929f28ee5"
};

@Injectable({
  providedIn: 'root'
})
export class FcmService {
  private apiUrl = 'http://localhost:3000/api/fcm';
  private messaging;
  public toastMessage = signal<any>(null);
  public notificationsHistory = signal<any[]>([]);

  // Local IDB Config
  private dbReq: IDBOpenDBRequest | null = null;
  private db: IDBDatabase | null = null;

  constructor(private http: HttpClient) {
    const app = initializeApp(firebaseConfig);
    this.messaging = getMessaging(app);
    this.initDB();
    this.listenForMessages();
  }

  private initDB() {
    this.dbReq = indexedDB.open('LmsNotifications', 1);
    this.dbReq.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('history')) {
         db.createObjectStore('history', { keyPath: 'id' });
      }
    };
    this.dbReq.onsuccess = (event: any) => {
      this.db = event.target.result;
      this.loadLocalHistory();
    };
  }

  public saveMessage(msg: any) {
    if (!this.db) return;
    const tx = this.db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    msg.id = msg.id || crypto.randomUUID();
    msg.created_at = msg.created_at || new Date().toISOString();
    store.put(msg);
    this.loadLocalHistory();
  }

  public loadLocalHistory() {
     if (!this.db) return;
     const tx = this.db.transaction('history', 'readonly');
     const store = tx.objectStore('history');
     const req = store.getAll();
     req.onsuccess = () => {
        const hist = req.result.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        this.notificationsHistory.set(hist);
     };
  }

  public syncHistory() {
     this.http.get<any[]>(`${this.apiUrl}/history`, { withCredentials: true }).subscribe({
         next: (res) => {
             res.forEach(item => this.saveMessage(item));
         },
         error: () => console.warn('Could not pull offline sync from Postgres')
     });
  }

  requestPermission() {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        
        // Eagerly sync Postgres offline history upon granted session boot!
        this.syncHistory();

        // [SUCCESS]: Utilizing explicit Firebase VAPID Web Push Key provided by candidate architecture natively!
        getToken(this.messaging, { vapidKey: 'BOMfvHsjgttyDmOd2taRnZyCjQ3ae8WAuZX0O7olPM_P4UXGgqvnypQNXnjl2Kc3wR-B4bSrusMRhxzV38oOO6g' }).then((token) => {
           if(token) {
              this.http.post(`${this.apiUrl}/register`, { token }, { withCredentials: true }).subscribe();
           }
        }).catch(err => {
            console.warn('FCM Token generation warned (missing VAPID config in UI). Proceeding seamlessly tracking pure Postgres + IndexedDB persistence offline instead!', err);
        });
      }
    });
  }

  listenForMessages() {
    try {
      onMessage(this.messaging, (payload) => {
        this.toastMessage.set(payload.notification);
        this.saveMessage({ title: payload.notification?.title, body: payload.notification?.body });
        this.playNotificationSound();
        setTimeout(() => this.toastMessage.set(null), 5000);
      });
    } catch(err) { console.warn('Foreground listen error. Web Push context missing. Check VAPID.', err); }
  }

  private playNotificationSound() {
    try {
      const ToneContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new ToneContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch(e) { console.warn('Audio Context constrained by strict browser user gesture policies.', e); }
  }
}
