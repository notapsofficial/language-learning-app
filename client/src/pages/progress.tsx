import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Star, Flame } from 'lucide-react';
import type { LearningStats, LanguageProgress, WeeklyData, Achievement } from '@shared/schema';

export default function ProgressPage() {
  const { data: learningStats, isLoading: statsLoading } = useQuery<LearningStats>({
    queryKey: ['/api/learning-stats'],
  });

  const { data: languageProgress, isLoading: langLoading } = useQuery<LanguageProgress[]>({
    queryKey: ['/api/language-progress'],
  });

  const { data: weeklyData, isLoading: weeklyLoading } = useQuery<WeeklyData>({
    queryKey: ['/api/weekly-data'],
  });

  const { data: achievements, isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements'],
  });

  if (statsLoading || langLoading || weeklyLoading || achievementsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!learningStats || !languageProgress || !weeklyData || !achievements) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-destructive">データの読み込みに失敗しました</div>
      </div>
    );
  }

  const overallProgress = learningStats.masteredWords && learningStats.totalWords 
    ? Math.round(((learningStats.masteredWords || 0) / (learningStats.totalWords || 1)) * 100)
    : 0;
  const circumference = 314; // 2 * π * 50
  const strokeDashoffset = circumference - (circumference * overallProgress) / 100;

  return (
    <div className="h-full overflow-y-auto">
      {/* Premium Status Bar */}
      <div className="premium-status-bar" />
      
      {/* Apple-Featured Grid Layout */}
      <div className="today-grid space-y-6">

      {/* Header */}
      <h1 className="text-2xl font-bold">進捗 📈</h1>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>全体の進捗</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Circular Progress */}
          <div className="flex justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle 
                  cx="60" 
                  cy="60" 
                  r="50" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  fill="none" 
                  className="text-muted opacity-20"
                />
                <circle 
                  cx="60" 
                  cy="60" 
                  r="50" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  fill="none" 
                  className="text-primary" 
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="text-2xl font-bold" data-testid="overall-progress">
                  {overallProgress}%
                </div>
                <div className="text-xs text-muted-foreground">完了</div>
              </div>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-primary" data-testid="total-words">
                {learningStats.totalWords}
              </div>
              <div className="text-xs text-muted-foreground">総単語数</div>
            </div>
            <div>
              <div className="text-xl font-bold text-accent" data-testid="mastered-words">
                {learningStats.masteredWords}
              </div>
              <div className="text-xs text-muted-foreground">習得済み</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle>週間学習時間</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-24 space-x-2">
            {weeklyData.map((day, index) => (
              <div key={day.label} className="flex-1 flex flex-col items-center">
                <div 
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    index === 5 ? 'bg-accent' : 'bg-primary'
                  }`}
                  style={{ height: `${day.percentage}%` }}
                  data-testid={`weekly-bar-${index}`}
                />
                <div className={`text-xs mt-2 ${
                  index === 5 ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}>
                  {day.label}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Language Progress */}
      <Card>
        <CardHeader>
          <CardTitle>言語別進捗</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {languageProgress.map((lang) => (
              <div key={lang.language} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl" data-testid={`lang-flag-${lang.language}`}>
                    {lang.flag}
                  </span>
                  <div>
                    <div className="text-sm font-medium" data-testid={`lang-name-${lang.language}`}>
                      {lang.name}
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid={`lang-words-${lang.language}`}>
                      {lang.words}単語
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${lang.percentage}%` }}
                      data-testid={`lang-progress-${lang.language}`}
                    />
                  </div>
                  <span className="text-xs font-medium" data-testid={`lang-percentage-${lang.language}`}>
                    {lang.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>達成バッジ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const isUnlocked = achievement.unlockedAt !== null;
              
              return (
                <div 
                  key={achievement.id} 
                  className={`text-center ${!isUnlocked ? 'opacity-50' : ''}`}
                  data-testid={`achievement-${achievement.id}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    isUnlocked 
                      ? achievement.title.includes('連続') 
                        ? 'bg-warning' 
                        : 'bg-accent'
                      : 'bg-muted'
                  }`}>
                    {isUnlocked ? (
                      achievement.title.includes('連続') ? (
                        <Flame className="h-5 w-5 text-white" />
                      ) : (
                        <Trophy className="h-5 w-5 text-accent-foreground" />
                      )
                    ) : (
                      <Star className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-xs font-medium" data-testid="achievement-title">
                    {achievement.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isUnlocked 
                      ? new Date(achievement.unlockedAt!).toLocaleDateString('ja-JP', {
                          month: 'short',
                          day: 'numeric',
                        }) + '獲得'
                      : achievement.requirement
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      </div>
    </div>
  );
}
