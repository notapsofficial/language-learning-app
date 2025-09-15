import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Trophy, Flame, Book, Mic, Star, TrendingUp, Calendar, Award } from 'lucide-react';
import type { DashboardData } from '@shared/schema';

export default function Dashboard() {
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-body text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-body text-destructive">データの読み込みに失敗しました</div>
      </div>
    );
  }

  // Calculate dynamic time greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return { text: "おやすみなさい", emoji: "🌙" };
    if (hour < 12) return { text: "おはよう", emoji: "🌅" };
    if (hour < 18) return { text: "こんにちは", emoji: "☀️" };
    return { text: "こんばんは", emoji: "🌆" };
  };

  const greeting = getTimeGreeting();
  const progressPercentage = dashboardData.overallProgress.percentage;
  const streakDays = dashboardData.todayStats.streakDays;

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Status Bar */}
      <div className="premium-status-bar" />
      
      {/* Apple-Featured Grid Layout */}
      <div className="today-grid max-w-6xl mx-auto">
        
        {/* Hero Feature Card */}
        <div className="featured-card featured-card-hero">
          {/* Enhanced contrast overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/30" />
          <div className="p-8 h-full flex flex-col justify-between relative z-20">
            <div>
              <div className="text-caption text-white/80 font-semibold tracking-widest uppercase mb-2">
                今日の学習
              </div>
              <h1 className="text-large-title text-white font-bold mb-3">
                {greeting.text}！<span className="text-4xl ml-2">{greeting.emoji}</span>
              </h1>
              <p className="text-body text-white/95 font-medium">
                今日も一緒に頑張りましょう
              </p>
            </div>
            <div className="flex items-end justify-between">
              <div className="flex space-x-8">
                <div className="text-center">
                  <div className="text-title-1 font-bold text-white mb-1" data-testid="today-words">
                    {dashboardData.todayStats.wordsLearned}
                  </div>
                  <div className="text-caption text-white/90 font-medium">新しい単語</div>
                </div>
                <div className="text-center">
                  <div className="text-title-1 font-bold text-white mb-1" data-testid="pronunciation-time">
                    {dashboardData.todayStats.pronunciationMinutes}
                  </div>
                  <div className="text-caption text-white/90 font-medium">分の発音練習</div>
                </div>
              </div>
              <div className="absolute top-6 right-6 opacity-20">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Star size={48} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Action Cards */}
        <div className="col-span-full grid grid-cols-2 gap-6">
          <Link href="/vocabulary">
            <div className="featured-card featured-card-action group cursor-pointer" data-testid="button-start-vocabulary">
              <div className="p-6 h-full flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-8 translate-x-8" />
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
                    <Book className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-title-3 text-card-foreground mb-2 font-bold">単語学習</h3>
                  <p className="text-subhead text-muted-foreground leading-relaxed">
                    新しい語彙を学んで
                    <br />語学力をアップ
                  </p>
                </div>
                <div className="flex justify-between items-center relative z-10">
                  <div className="text-xs text-muted-foreground font-medium">今すぐ始める</div>
                  <TrendingUp className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/pronunciation">
            <div className="featured-card featured-card-action group cursor-pointer" data-testid="button-start-pronunciation">
              <div className="p-6 h-full flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -translate-y-8 translate-x-8" />
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/25">
                    <Mic className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-title-3 text-card-foreground mb-2 font-bold">発音練習</h3>
                  <p className="text-subhead text-muted-foreground leading-relaxed">
                    AIと一緒に正しい
                    <br />発音をマスター
                  </p>
                </div>
                <div className="flex justify-between items-center relative z-10">
                  <div className="text-xs text-muted-foreground font-medium">録音して練習</div>
                  <div className="flex space-x-1">
                    {[1,2,3].map(i => (
                      <div key={i} className={`w-1 h-4 bg-orange-500 rounded-full wave-animation`} style={{animationDelay: `${i * 0.1}s`}} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Premium Streak Card */}
        <div className="featured-card featured-card-stats">
          <div className="p-6 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-title-3 text-card-foreground font-bold">学習の連続記録</h3>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Flame className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-center mb-6">
              <div className="text-large-title font-bold text-accent mb-2" data-testid="streak-days">
                {streakDays}
              </div>
              <div className="text-caption text-muted-foreground font-medium">日連続</div>
            </div>
            <div className="flex justify-center space-x-2">
              {Array.from({ length: 7 }, (_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    i < streakDays
                      ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white scale-110 shadow-lg shadow-orange-500/25'
                      : i === streakDays
                      ? 'bg-muted border-2 border-primary scale-105'
                      : 'bg-muted/50'
                  }`}
                >
                  {i < streakDays ? (
                    <span className="text-xs font-bold">✓</span>
                  ) : i === streakDays ? (
                    <span className="text-xs font-bold text-primary">今</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{i + 1}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Premium Progress Card */}
        <div className="featured-card featured-card-stats">
          <div className="p-6 h-full flex flex-col justify-center">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-title-3 text-card-foreground font-bold">全体の進捗</h3>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center justify-center mb-6">
              <div className="progress-ring-container">
                <svg className="w-28 h-28" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(142, 95%, 50%)" />
                      <stop offset="100%" stopColor="hsl(160, 85%, 55%)" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/> 
                      </feMerge>
                    </filter>
                  </defs>
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    className="progress-ring-background"
                  />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    className="progress-ring-progress"
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 - (251.2 * progressPercentage) / 100}
                    filter="url(#glow)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-title-2 font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent" data-testid="overall-progress">
                      {progressPercentage}%
                    </div>
                    <div className="text-caption text-muted-foreground font-medium">完了</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="text-headline font-bold text-blue-600 dark:text-blue-400" data-testid="total-words">
                  {dashboardData.overallProgress.totalWords}
                </div>
                <div className="text-caption text-muted-foreground font-medium">総単語数</div>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <div className="text-headline font-bold text-emerald-600 dark:text-emerald-400" data-testid="mastered-words">
                  {dashboardData.overallProgress.masteredWords}
                </div>
                <div className="text-caption text-muted-foreground font-medium">習得済み</div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Achievements Card */}
        <div className="col-span-full featured-card">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-title-3 text-card-foreground font-bold">最近の達成</h3>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/25">
                <Award className="h-6 w-6 text-white" />
              </div>
            </div>
            
            {dashboardData.recentAchievements.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentAchievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-secondary/30 to-secondary/10 hover:from-secondary/50 hover:to-secondary/20 transition-all duration-300 border border-border/30">
                    <div className="achievement-badge">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-callout font-medium text-card-foreground" data-testid="achievement-title">
                        {achievement.title}
                      </div>
                      <div className="text-caption text-muted-foreground" data-testid="achievement-description">
                        {achievement.description}
                      </div>
                    </div>
                    <div className="text-caption text-muted-foreground">
                      {achievement.unlockedAt ? new Date(achievement.unlockedAt).toLocaleDateString('ja-JP', { 
                        month: 'short', 
                        day: 'numeric' 
                      }) : '未達成'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Star className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="text-callout text-muted-foreground font-medium mb-2">
                  まだ達成がありません
                </div>
                <div className="text-caption text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  学習を続けて初めての達成を目指しましょう！
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom padding for tab navigation */}
        <div className="col-span-full pb-24" />
      </div>
    </div>
  );
}