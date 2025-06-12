'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useJournalStore } from '@/store/journalStore';
import { JournalEntry } from '@/store/journalStore';
import { Loader2, Settings, LogOut, PenLine, BarChart3, Filter } from 'lucide-react';
import MoodGraph from '@/components/MoodGraph';
import WordCloud from '@/components/WordCloud';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TimeFilter = '1d' | '1w' | '1m' | '1y' | 'all';
type MoodFilter = '1' | '2' | '3' | '4' | '5' | 'all';

const timeFilterOptions = [
  { value: '1d', label: 'Last 24 Hours' },
  { value: '1w', label: 'Last Week' },
  { value: '1m', label: 'Last Month' },
  { value: '1y', label: 'Last Year' },
  { value: 'all', label: 'All Time' },
];

const moodFilterOptions = [
  { value: 'all', label: 'All Moods' },
  { value: '1', label: '😢 Very Bad' },
  { value: '2', label: '😕 Bad' },
  { value: '3', label: '😐 Neutral' },
  { value: '4', label: '🙂 Good' },
  { value: '5', label: '😊 Very Good' },
];

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
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [moodFilter, setMoodFilter] = useState<MoodFilter>('all');
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);

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

  useEffect(() => {
    if (!journalEntries) return;

    const now = new Date();
    const filtered = journalEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      
      // Time filter
      if (timeFilter !== 'all') {
        const timeLimit = new Date();
        switch (timeFilter) {
          case '1d':
            timeLimit.setDate(now.getDate() - 1);
            break;
          case '1w':
            timeLimit.setDate(now.getDate() - 7);
            break;
          case '1m':
            timeLimit.setMonth(now.getMonth() - 1);
            break;
          case '1y':
            timeLimit.setFullYear(now.getFullYear() - 1);
            break;
        }
        if (entryDate < timeLimit) return false;
      }

      // Mood filter
      if (moodFilter !== 'all' && entry.mood !== moodFilter) {
        return false;
      }

      return true;
    });

    setFilteredEntries(filtered);
  }, [journalEntries, timeFilter, moodFilter]);

  const resetFilters = () => {
    setTimeFilter('all');
    setMoodFilter('all');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Get today's date in user's local timezone
      const now = new Date();
      const today = now.toLocaleDateString('en-CA'); // 'en-CA' gives YYYY-MM-DD format
      
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4">
        <header className="bg-white dark:bg-gray-800 shadow rounded-lg mb-4 sm:mb-6">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white h-8 w-8 sm:h-10 sm:w-10">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white h-8 w-8 sm:h-10 sm:w-10">
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="relative rounded-2xl h-[24rem] sm:h-[32rem] overflow-hidden shadow-2xl">
              {/* Background with gradient and pattern */}
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/90 via-purple-500/90 to-blue-500/90 dark:from-indigo-900/90 dark:via-purple-900/90 dark:to-blue-900/90 animate-gradient-xy" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
              </div>

              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center px-4">
                <div className="text-center space-y-6 max-w-3xl">
                  <div className="inline-block">
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80 dark:from-white dark:to-white/90 animate-fade-in-up">
                      Welcome, {user.displayName || user.email?.split('@')[0]}!
                    </h1>
                  </div>
                  <p className="text-lg sm:text-xl md:text-2xl text-white/90 dark:text-white/80 font-medium animate-fade-in-up delay-100">
                    Your personal journey starts here.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 animate-fade-in-up delay-200">
                    <button 
                      onClick={() => {
                        document.getElementById('journal-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all duration-300 font-medium text-sm sm:text-base"
                    >
                      Start Journaling
                    </button>
                    <button 
                      onClick={() => {
                        document.getElementById('stats-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-all duration-300 font-medium text-sm sm:text-base"
                    >
                      View Stats
                    </button>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/10 to-transparent" />
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/10 to-transparent" />
            </div>
          </div>
        </main>

        {/* Entry Form */}
        <div id="journal-section" className="mt-8">
          <Card className="p-6 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-4 mb-6">
              <PenLine className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">How was your day?</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="content" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                  Write your daily reflection
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-24 sm:h-32 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Write a sentence or two about your day..."
                  required
                  disabled={isSubmitting || journalLoading}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                  How are you feeling?
                </label>
                <div className="flex gap-2 sm:gap-4">
                  {Object.entries(moodEmojis).map(([value, emoji]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedMood(value)}
                      className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-lg text-xl sm:text-2xl transition-all duration-200 ${
                        selectedMood === value
                          ? 'bg-purple-100 dark:bg-purple-900/50 ring-2 ring-purple-500'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      disabled={isSubmitting || journalLoading}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm sm:text-base bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || journalLoading || !content.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-medium text-sm sm:text-base transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <PenLine className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Save Entry</span>
                  </>
                )}
              </button>
            </form>
          </Card>
        </div>

        {/* Mood Graph */}
        <div className="mt-8">
          <MoodGraph 
            entries={journalEntries} 
            onEntryClick={(entry) => setSelectedEntry(entry)}
          />
        </div>

        {/* Word Cloud */}
        <div className="mt-8">
          <WordCloud entries={journalEntries} />
        </div>

        {/* Mood Stats */}
        {journalEntries.length > 0 && (
          <div id="stats-section" className="mt-8">
            <Card className="p-6 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-4 mb-6">
                <BarChart3 className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Mood Trends</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {moodStats.total}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Entries</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {moodStats.averageMood.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Average Mood</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Object.entries(moodStats.byMood).reduce((a, b) => a[1] > b[1] ? a : b)[0]}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Most Common Mood</div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Entry History */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Entries
            </h2>
            <div className="flex items-center gap-2">
              <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  {timeFilterOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={moodFilter} onValueChange={(value: MoodFilter) => setMoodFilter(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Mood" />
                </SelectTrigger>
                <SelectContent>
                  {moodFilterOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(timeFilter !== 'all' || moodFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          </div>

          {journalLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry: JournalEntry) => (
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
              {filteredEntries.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  {journalEntries.length === 0 
                    ? "No entries yet. Start by writing about your day!"
                    : "No entries match the current filters."}
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
