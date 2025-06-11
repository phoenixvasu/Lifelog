import { create } from 'zustand';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

export interface JournalEntry {
  id?: string;
  userId: string;
  content: string;
  mood: string;
  date: string;
  createdAt: string;
  updatedAt?: string;
}

interface JournalState {
  entries: JournalEntry[];
  loading: boolean;
  error: string | null;
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  fetchEntries: (userId: string) => Promise<void>;
  clearEntries: () => void;
  getMoodStats: () => {
    total: number;
    byMood: Record<string, number>;
    averageMood: number;
  };
}

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],
  loading: false,
  error: null,

  addEntry: async (entry) => {
    try {
      set({ loading: true, error: null });
      console.log('Adding journal entry:', entry);

      const docRef = await addDoc(collection(db, 'journal_entries'), {
        ...entry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      const newEntry: JournalEntry = {
        ...entry,
        id: docRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      console.log('Journal entry added successfully:', newEntry);
      
      set((state) => ({
        entries: [newEntry, ...state.entries],
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error adding journal entry:', error);
      set({ 
        error: error.message || 'Failed to add journal entry', 
        loading: false 
      });
      throw error;
    }
  },

  fetchEntries: async (userId) => {
    try {
      set({ loading: true, error: null });
      console.log('Fetching journal entries for user:', userId);

      const q = query(
        collection(db, 'journal_entries'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const entries: JournalEntry[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as JournalEntry);
      });
      
      console.log('Fetched journal entries:', entries);
      
      set({ entries, loading: false });
    } catch (error: any) {
      console.error('Error fetching journal entries:', error);
      set({ 
        error: error.message || 'Failed to fetch journal entries', 
        loading: false 
      });
      throw error;
    }
  },

  getMoodStats: () => {
    const { entries } = get();
    const byMood: Record<string, number> = {};
    let total = 0;
    let moodSum = 0;

    entries.forEach((entry) => {
      byMood[entry.mood] = (byMood[entry.mood] || 0) + 1;
      total++;
      const moodValue = parseInt(entry.mood);
      if (!isNaN(moodValue)) {
        moodSum += moodValue;
      }
    });

    return {
      total,
      byMood,
      averageMood: total > 0 ? moodSum / total : 0,
    };
  },

  clearEntries: () => set({ entries: [] }),
})); 