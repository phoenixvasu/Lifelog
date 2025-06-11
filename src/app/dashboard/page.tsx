'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useJournalStore } from '@/store/journalStore';
import { JournalEntry } from '@/store/journalStore';
import { Loader2, Settings, LogOut } from 'lucide-react';
import MoodGraph from '@/components/MoodGraph';
import WordCloud from '@/components/WordCloud';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading, signOut } = useAuthStore();
  const { entries: journalEntries, addEntry, fetchEntries, loading: journalLoading, error: journalError, getMoodStats } = useJournalStore();
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState('3'); // Default to neutral mood
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  // Fetch entries when component mounts
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          await fetchEntries(user.uid);
        } catch (error) {
          console.error('Error loading data:', error);
          setError('Failed to load your entries. Please try refreshing the page.');
        }
      };
      loadData();
    }
  }, [user, fetchEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Add journal entry with mood
      await addEntry({
        userId: user.uid,
        content: content.trim(),
        mood: selectedMood,
        date: today,
      });

      // Clear form
      setContent('');
      setSelectedMood('3');
    } catch (error: any) {
      console.error('Error submitting entry:', error);
      setError(error.message || 'Failed to save your entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const moodEmojis = {
    '1': '😢',
    '2': '😕',
    '3': '😐',
    '4': '🙂',
    '5': '😄',
  };

  const moodStats = getMoodStats();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
      router.push('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="relative border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-lg h-96 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 dark:from-gray-900 to-purple-50 dark:to-gray-800 animate-gradient-xy">
              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 animate-fade-in-up">
                Welcome, {user.displayName || user.email?.split('@')[0]}!
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 animate-fade-in-up delay-100">
                Your personal journey starts here.
              </p>
            </div>
          </div>
        </main>

        {/* Entry Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="mb-4">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How was your day?
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              rows={4}
              placeholder="Write a sentence or two about your day..."
              required
              disabled={isSubmitting || journalLoading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How are you feeling?
            </label>
            <div className="flex gap-4">
              {Object.entries(moodEmojis).map(([value, emoji]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedMood(value)}
                  className={`flex-1 py-2 px-4 rounded-md text-2xl transition-colors ${
                    selectedMood === value
                      ? 'bg-indigo-100 dark:bg-indigo-900'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  disabled={isSubmitting || journalLoading}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || journalLoading || !content.trim()}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </div>
            ) : (
              'Save Entry'
            )}
          </button>
        </form>

        {/* Mood Graph */}
        <div className="mb-8">
          <MoodGraph 
            entries={journalEntries} 
            onEntryClick={(entry) => setSelectedEntry(entry)}
          />
        </div>

        {/* Word Cloud */}
        <div className="mb-8">
          <WordCloud entries={journalEntries} />
        </div>

        {/* Mood Stats */}
        {journalEntries.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Mood Overview
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {moodStats.total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Entries</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {moodStats.averageMood.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Average Mood</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {Object.entries(moodStats.byMood).reduce((a, b) => a[1] > b[1] ? a : b)[0]}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Most Common Mood</div>
              </div>
            </div>
          </div>
        )}

        {/* Entry History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Entries
          </h2>
          {journalLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {journalEntries.map((entry: JournalEntry) => (
                <div
                  key={entry.id}
                  className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{moodEmojis[entry.mood as keyof typeof moodEmojis]}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{entry.content}</p>
                </div>
              ))}
              {journalEntries.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No entries yet. Start by writing about your day!
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Entry Detail Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Entry from {selectedEntry && new Date(selectedEntry.date).toLocaleDateString()}
            </DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">
                  {moodEmojis[selectedEntry.mood as keyof typeof moodEmojis]}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(selectedEntry.date).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {selectedEntry.content}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
