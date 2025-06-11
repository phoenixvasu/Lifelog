'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { JournalEntry } from '@/store/journalStore';
import { format, subDays, subWeeks, subMonths, eachDayOfInterval, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, BarChart3, TrendingUp } from 'lucide-react';

interface MoodGraphProps {
  entries: JournalEntry[];
  onEntryClick?: (entry: JournalEntry) => void;
}

type TimeRange = 'day' | 'week' | 'month';

const moodEmojis = {
  '1': '😢',
  '2': '😕',
  '3': '😐',
  '4': '🙂',
  '5': '😄',
};

const moodLabels = {
  '1': 'Very Sad',
  '2': 'Sad',
  '3': 'Neutral',
  '4': 'Happy',
  '5': 'Very Happy',
};

export default function MoodGraph({ entries, onEntryClick }: MoodGraphProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const data = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'day':
        startDate = subDays(now, 1);
        break;
      case 'week':
        startDate = subWeeks(now, 1);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      default:
        startDate = subWeeks(now, 1);
    }

    // Create array of dates in range
    const dates = eachDayOfInterval({ start: startDate, end: now });

    // Create data points for each date
    return dates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEntries = entries.filter(entry => 
        isSameDay(new Date(entry.date), date)
      );

      // Calculate average mood for the day
      const avgMood = dayEntries.length > 0
        ? dayEntries.reduce((sum, entry) => sum + Number(entry.mood), 0) / dayEntries.length
        : null;

      return {
        date: format(date, 'MMM dd'),
        mood: avgMood,
        entries: dayEntries,
      };
    });
  }, [entries, timeRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <Card className="p-3 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          {dataPoint.mood !== null ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Average Mood: {moodEmojis[String(Math.round(dataPoint.mood)) as keyof typeof moodEmojis]} ({dataPoint.mood.toFixed(1)})
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Entries: {dataPoint.entries.length}
              </p>
              {dataPoint.entries.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Latest Entry:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {dataPoint.entries[0].content.substring(0, 50)}...
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">No entries</p>
          )}
        </Card>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 bg-white dark:bg-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Mood Trends
        </h2>
        <div className="flex gap-2">
          <Button
            variant={timeRange === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('day')}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Day
          </Button>
          <Button
            variant={timeRange === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('week')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Week
          </Button>
          <Button
            variant={timeRange === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('month')}
            className="flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Month
          </Button>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            onClick={(data) => {
              if (data.activePayload && onEntryClick) {
                const entries = data.activePayload[0].payload.entries;
                if (entries.length > 0) {
                  onEntryClick(entries[0]);
                }
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis
              dataKey="date"
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
              tickLine={{ stroke: '#6B7280' }}
            />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tickFormatter={(value) => moodEmojis[value as keyof typeof moodEmojis]}
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
              tickLine={{ stroke: '#6B7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={{ fill: '#8B5CF6', strokeWidth: 2 }}
              activeDot={{ r: 8, fill: '#8B5CF6' }}
              name="Mood"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex justify-center gap-4">
        {Object.entries(moodEmojis).map(([value, emoji]) => (
          <div key={value} className="text-center">
            <span className="text-2xl">{emoji}</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {moodLabels[value as keyof typeof moodLabels]}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
} 