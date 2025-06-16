'use client';

import { 
  Heart, 
  BookOpen, 
  BarChart3, 
  Shield, 
  Download, 
  Bell, 
  Cloud,
  Sparkles,
  Calendar,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const moods = [
    { emoji: '🙂', label: 'Happy', color: 'bg-yellow-100 text-yellow-600' },
    { emoji: '🙁', label: 'Sad', color: 'bg-blue-100 text-blue-600' },
    { emoji: '😐', label: 'Neutral', color: 'bg-gray-100 text-gray-600' },
    { emoji: '😫', label: 'Stressed', color: 'bg-red-100 text-red-600' },
    { emoji: '😃', label: 'Excited', color: 'bg-orange-100 text-orange-600' },
    { emoji: '🤩', label: 'Amazing', color: 'bg-purple-100 text-purple-600' }
  ];

  const features = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: 'Sentence-a-Day Journaling',
      description: 'Capture your thoughts in just one meaningful sentence each day.'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Mood Tracking & Graphs',
      description: 'Visualize your emotional patterns and growth over time.'
    },
    {
      icon: <Cloud className="w-6 h-6" />,
      title: 'Word Cloud Memory Maps',
      description: 'See your most meaningful words transform into beautiful clouds.'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: '100% Private & Secure',
      description: 'Your thoughts stay yours. Hosted privately with full encryption.'
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'Downloadable Data',
      description: 'Export your entire journal as JSON. Your data, your control.'
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: 'Gentle Daily Reminders',
      description: 'Soft nudges to help you maintain your daily reflection habit.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-full p-3 sm:p-4 shadow-lg">
                  <Heart className="w-8 h-8 sm:w-12 sm:h-12 text-purple-600" />
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-4">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                One sentence a day.
              </span>
              <br />
              <span className="text-gray-800 text-2xl sm:text-4xl lg:text-5xl">A lifetime of emotions.</span>
            </h1>
            
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed px-4">
              LifeLog helps you track your emotions, memories, and reflections in just one line a day. 
              <span className="font-semibold text-gray-800"> Mood graphs, word clouds, and more</span> — all private, all yours.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
              <Link href="/auth" className="w-full sm:w-auto">
                <button className="w-full group relative bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                  <span className="relative z-10">Start Logging</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              </Link>
              {/* <button className="w-full sm:w-auto text-gray-600 hover:text-gray-800 font-medium transition-colors py-3">
                View Demo →
              </button> */}
            </div>
          </div>
        </div>
      </section>

      {/* Mood Palette Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Express Your <span className="text-purple-600">Emotions</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Choose from our mood palette to capture how you're feeling each day
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 max-w-4xl mx-auto px-4">
            {moods.map((mood, index) => (
              <div 
                key={index} 
                className="group relative bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 cursor-pointer"
              >
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                    {mood.emoji}
                  </div>
                  <div className={`text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full ${mood.color}`}>
                    {mood.label}
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Everything You Need to <span className="text-blue-600">Reflect</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Simple, powerful tools designed for meaningful daily reflection
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-4">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 sm:p-3 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visualization Preview */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-purple-600/5 to-blue-600/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Watch Your Journey <span className="text-purple-600">Unfold</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              See your emotional patterns emerge through beautiful visualizations
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center px-4">
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mr-2 sm:mr-3" />
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">Mood Trends</span>
                </div>
                <div className="h-24 sm:h-32 bg-gradient-to-r from-green-200 to-blue-200 rounded-lg flex items-end p-3 sm:p-4 space-x-1 sm:space-x-2">
                  {[40, 65, 45, 80, 70, 85, 60].map((height, i) => (
                    <div 
                      key={i} 
                      className="bg-gradient-to-t from-purple-500 to-blue-500 rounded-sm flex-1 transition-all duration-500 hover:opacity-80"
                      style={{ height: `${height}%` }}
                    ></div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mr-2 sm:mr-3" />
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">Daily Entries</span>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className="text-xl sm:text-2xl">😃</span>
                    <span className="text-gray-600 text-xs sm:text-sm">"Finally finished my first marathon today!"</span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className="text-xl sm:text-2xl">🙂</span>
                    <span className="text-gray-600 text-xs sm:text-sm">"Coffee with mom was exactly what I needed."</span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className="text-xl sm:text-2xl">😐</span>
                    <span className="text-gray-600 text-xs sm:text-sm">"Another quiet Tuesday, but that's okay."</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-center mb-4 sm:mb-6">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mr-2 sm:mr-3" />
                <span className="font-semibold text-gray-900 text-sm sm:text-base">Word Cloud Memories</span>
              </div>
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="flex justify-center items-center space-x-2 sm:space-x-4 flex-wrap">
                  <span className="text-xl sm:text-2xl font-bold text-purple-600">grateful</span>
                  <span className="text-base sm:text-lg text-blue-500">family</span>
                  <span className="text-lg sm:text-xl font-semibold text-green-600">growth</span>
                </div>
                <div className="flex justify-center items-center space-x-2 sm:space-x-4 flex-wrap">
                  <span className="text-base sm:text-lg text-orange-500">adventure</span>
                  <span className="text-2xl sm:text-3xl font-bold text-pink-600">love</span>
                  <span className="text-base sm:text-lg text-indigo-500">learning</span>
                </div>
                <div className="flex justify-center items-center space-x-2 sm:space-x-4 flex-wrap">
                  <span className="text-lg sm:text-xl text-teal-600">peaceful</span>
                  <span className="text-base sm:text-lg font-semibold text-red-500">challenge</span>
                  <span className="text-xl sm:text-2xl font-bold text-yellow-600">joy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 
