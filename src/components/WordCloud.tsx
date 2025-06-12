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

  color?: string;

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

  const [layoutKey, setLayoutKey] = useState(0);



  // Memoized function to process text and generate word cloud data

  const processText = useMemo(() => {

    return (text: string) => {

      const doc = nlp(text);

      const nouns = doc.nouns().out('array');

      const verbs = doc.verbs().out('array');

      const adjectives = doc.adjectives().out('array');

      const allWords = [...nouns, ...verbs, ...adjectives];



      const wordCount = new Map<string, number>();

      allWords.forEach(word => {

        const cleanWord = word.toLowerCase().trim();

        if (cleanWord.length > 2 && !STOP_WORDS.has(cleanWord)) {

          wordCount.set(cleanWord, (wordCount.get(cleanWord) || 0) + 1);

        }

      });



      return Array.from(wordCount.entries())

        .map(([text, value]) => ({ text, value }))

        .sort((a, b) => b.value - a.value)

        .slice(0, 100); // Limit to top 100 words

    };

  }, []);



  // Effect to filter entries and process text

  useEffect(() => {

    if (entries.length === 0) {

      setWords([]);

      setIsLoading(false);

      return;

    }



    console.log('WordCloud received entries:', entries); // Debug: log entries

    const now = new Date();

    let filteredEntries = entries;



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



    const allContent = filteredEntries.map(entry => entry.content).join(' ');

    const newWordData = processText(allContent);

    setWords(newWordData);

    setLayoutKey(prevKey => prevKey + 1);

  }, [entries, timeRange, processText]);



  // Combined effect for SVG dimensions and d3-cloud layout

  useEffect(() => {

    if (!svgRef.current) {

      setIsLoading(false); // If ref not available, nothing to load

      return;

    }



    const width = svgRef.current.clientWidth;

    const height = svgRef.current.clientHeight;



    if (words.length === 0 || width === 0 || height === 0) {

      setIsLoading(false);

      return;

    }



    setIsLoading(true);

    console.log('Running d3-cloud layout with dimensions:', { width, height });



    // Calculate a dynamic max font size based on available space and word frequency

    const maxWordValue = words.reduce((max, d) => Math.max(max, d.value), 0);

    const minFontSize = 12; // Increased from 10 for better mobile readability

    const maxFontSize = Math.min(

      Math.max(width * 0.1, 40), // Minimum max font size of 40px

      Math.min(width * 0.15, 80) // Maximum max font size of 80px

    );



    const scaleFontSize = (value: number) => {

      if (maxWordValue === 0) return minFontSize;

      const ratio = value / maxWordValue;

      return Math.max(

        minFontSize,

        Math.min(

          maxFontSize,

          minFontSize + ((maxFontSize - minFontSize) * (ratio))

        )

      );

    };



    const layout = cloud()

      .size([width, height]) // Use dynamically calculated dimensions

      .words(words.map(d => ({

        text: d.text,

        size: scaleFontSize(d.value), // Use scaled font size

        value: d.value,

        color: COLORS[Math.floor(Math.random() * COLORS.length)]

      })))

      .padding(5)

      .rotate(() => ~~(Math.random() * 2) * 90)

      .font('system-ui')

      .fontSize((d: any) => d.size)

      .on('end', (laidOutWords: any[]) => {

        console.log('d3-cloud laid out words:', laidOutWords); // Log laid out words

        setWords(laidOutWords.map(d => ({

          ...d,

          x: d.x,

          y: d.y,

          rotation: d.rotate,

          size: d.size,

          color: d.color

        })));

        setIsLoading(false);

      });



    layout.start();



    // Cleanup function for d3-cloud layout (optional, but good practice if layout is long-running)

    return () => {

      // If there's a way to stop the layout, put it here. d3-cloud doesn't have a stop method directly.

      // For now, simple cleanup is fine.

    };

  }, [words.length, svgRef.current, layoutKey]); // Depend on svgRef.current directly



  const handleRefresh = () => {

    setIsLoading(true);

    setLayoutKey(prevKey => prevKey + 1); // Force layout re-run

  };



  const handleTimeRangeChange = (range: 'all' | 'month' | 'week') => {

    setTimeRange(range);

    setIsLoading(true); // Show loader when filter changes

  };



  return (

    <Card className="p-4 sm:p-6 bg-white dark:bg-gray-800">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-4 sm:mb-6">

        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">

          Word Cloud

        </h2>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">

          <Button

            variant={timeRange === 'all' ? 'default' : 'outline'}

            size="sm"

            onClick={() => handleTimeRangeChange('all')}

            className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"

          >

            All Time

          </Button>

          <Button

            variant={timeRange === 'month' ? 'default' : 'outline'}

            size="sm"

            onClick={() => handleTimeRangeChange('month')}

            className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"

          >

            Last Month

          </Button>

          <Button

            variant={timeRange === 'week' ? 'default' : 'outline'}

            size="sm"

            onClick={() => handleTimeRangeChange('week')}

            className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"

          >

            Last Week

          </Button>

          <Button

            variant="outline"

            size="sm"

            onClick={handleRefresh}

            className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"

            disabled={isLoading}

          >

            {isLoading ? (

              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />

            ) : (

              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />

            )}

            Refresh

          </Button>

        </div>

      </div>



      <div className="relative h-[300px] sm:h-[400px] w-full">

        {isLoading ? (

          <div className="absolute inset-0 flex items-center justify-center">

            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-purple-600" />

          </div>

        ) : words.length === 0 ? (

          <div className="absolute inset-0 flex items-center justify-center">

            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 text-center px-4">

              {entries.length === 0

                ? "No entries yet. Start by writing about your day!"

                : "No words found in the selected time range."}

            </p>

          </div>

        ) : (

          <svg

            ref={svgRef}

            className="w-full h-full"

            style={{ minHeight: '300px' }}

          >

            <g transform={`translate(${svgRef.current?.clientWidth ? svgRef.current.clientWidth / 2 : 0},${svgRef.current?.clientHeight ? svgRef.current.clientHeight / 2 : 0})`}>

              {words.map((word, i) => (

                <text

                  key={`${word.text}-${i}`}

                  transform={`translate(${word.x},${word.y}) rotate(${word.rotation})`}

                  textAnchor="middle"

                  style={{

                    fontSize: `${word.size}px`,

                    fontFamily: 'system-ui, -apple-system, sans-serif',

                    fill: word.color,

                    cursor: 'pointer',

                    userSelect: 'none',

                    WebkitUserSelect: 'none',

                  }}

                  className="transition-all duration-200 hover:opacity-80"

                >

                  {word.text}

                </text>

              ))}

            </g>

          </svg>

        )}

      </div>



      {words.length > 0 && (

        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-3">

          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">

            Word count: {words.length}

          </div>

          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">

            • Most frequent: {words[0]?.text} ({words[0]?.value} times)

          </div>

        </div>

      )}

    </Card>

  );
}