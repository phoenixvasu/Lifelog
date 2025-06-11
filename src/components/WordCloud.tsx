'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import cloud from 'd3-cloud';
import nlp from 'compromise';
import { JournalEntry } from '@/store/journalStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

interface WordCloudProps {
  entries: JournalEntry[];
}

interface WordData {
  text: string;
  value: number;
  x?: number;
  y?: number;
  rotation?: number;
  size?: number;
}

// Common words to exclude from the word cloud
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'is', 'was', 'are', 'were', 'been', 'being', 'am', 'have', 'has', 'had',
  'do', 'does', 'did', 'doing', 'would', 'could', 'should', 'might', 'must',
  'shall', 'will', 'can', 'may', 'need', 'ought', 'dare', 'used'
]);

const COLORS = ['#8B5CF6', '#6D28D9', '#4C1D95', '#7C3AED', '#5B21B6'];

export default function WordCloud({ entries }: WordCloudProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [words, setWords] = useState<WordData[]>([]);
  const [timeRange, setTimeRange] = useState<'all' | 'month' | 'week'>('all');
  const svgRef = useRef<SVGSVGElement>(null);
  const [key, setKey] = useState(0); // Add a key for forcing re-render

  // Process text and generate word cloud data
  const processText = useMemo(() => {
    return (text: string) => {
      const doc = nlp(text);
      
      // Extract nouns, verbs, and adjectives
      const nouns = doc.nouns().out('array');
      const verbs = doc.verbs().out('array');
      const adjectives = doc.adjectives().out('array');
      
      // Combine all words
      const allWords = [...nouns, ...verbs, ...adjectives];
      
      // Count word frequency
      const wordCount = new Map<string, number>();
      allWords.forEach(word => {
        const cleanWord = word.toLowerCase().trim();
        if (cleanWord.length > 2 && !STOP_WORDS.has(cleanWord)) {
          wordCount.set(cleanWord, (wordCount.get(cleanWord) || 0) + 1);
        }
      });
      
      // Convert to array and sort by frequency
      return Array.from(wordCount.entries())
        .map(([text, value]) => ({ text, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 100); // Limit to top 100 words
    };
  }, []);

  // Update word cloud when entries or time range changes
  useEffect(() => {
    const processEntries = () => {
      const now = new Date();
      let filteredEntries = entries;
      
      // Filter entries based on time range
      if (timeRange !== 'all') {
        const cutoffDate = new Date();
        if (timeRange === 'month') {
          cutoffDate.setMonth(now.getMonth() - 1);
        } else if (timeRange === 'week') {
          cutoffDate.setDate(now.getDate() - 7);
        }
        
        filteredEntries = entries.filter(entry => 
          new Date(entry.date) >= cutoffDate
        );
      }
      
      // Combine all entry content
      const allText = filteredEntries
        .map(entry => entry.content)
        .join(' ');
      
      // Process text and update words
      const processedWords = processText(allText);
      setWords(processedWords);
    };
    
    processEntries();
    setIsLoading(false);
  }, [entries, timeRange, processText, key]); // Add key to dependencies

  // Generate word cloud layout
  useEffect(() => {
    if (!svgRef.current || words.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const layout = cloud()
      .size([width, height])
      .words(words.map(d => ({
        text: d.text,
        size: 10 + (d.value * 2),
        value: d.value
      })))
      .padding(5)
      .rotate(() => ~~(Math.random() * 2) * 90)
      .font('system-ui')
      .fontSize((d: WordData) => d.size!)
      .on('end', (words: WordData[]) => {
        setWords(words.map((d: any) => ({
          ...d,
          x: d.x,
          y: d.y,
          rotation: d.rotate,
          size: d.size
        })));
        setIsLoading(false);
      });

    layout.start();
  }, [words.length, svgRef.current?.clientWidth, svgRef.current?.clientHeight]);

  const handleRefresh = () => {
    setIsLoading(true);
    setKey(prev => prev + 1); // Force re-render
  };

  return (
    <Card className="p-6 bg-white dark:bg-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Word Cloud
        </h2>
        <div className="flex gap-2">
          <Button
            variant={timeRange === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('week')}
          >
            Week
          </Button>
          <Button
            variant={timeRange === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('month')}
          >
            Month
          </Button>
          <Button
            variant={timeRange === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('all')}
          >
            All Time
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="ml-2"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="h-[400px] w-full relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : words.length > 0 ? (
          <svg
            ref={svgRef}
            className="w-full h-full"
            style={{ fontFamily: 'system-ui' }}
          >
            <g transform={`translate(${svgRef.current?.clientWidth! / 2},${svgRef.current?.clientHeight! / 2})`}>
              {words.map((word, i) => (
                <text
                  key={word.text}
                  textAnchor="middle"
                  transform={`translate(${word.x},${word.y}) rotate(${word.rotation})`}
                  style={{
                    fontSize: `${word.size}px`,
                    fill: COLORS[i % COLORS.length],
                    opacity: 0.8,
                    transition: 'all 0.3s ease',
                  }}
                  className="hover:opacity-100 hover:scale-110 cursor-pointer"
                >
                  {word.text}
                </text>
              ))}
            </g>
          </svg>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            No words to display
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>Word cloud shows the most frequently used words in your journal entries.</p>
        <p className="mt-1">Words are processed using natural language processing to identify meaningful terms.</p>
      </div>
    </Card>
  );
} 