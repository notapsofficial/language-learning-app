import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VocabularyCard } from '@/components/vocabulary-card';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Vocabulary, UserProgress } from '@shared/schema';

export default function VocabularyPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: vocabulary, isLoading } = useQuery<Vocabulary[]>({
    queryKey: ['/api/vocabulary'],
  });

  const { data: userProgress } = useQuery<UserProgress[]>({
    queryKey: ['/api/progress'],
  });

  const markProgressMutation = useMutation({
    mutationFn: async (data: { vocabularyId: string; learned?: boolean; difficult?: boolean }) => {
      const existingProgress = userProgress?.find(p => p.vocabularyId === data.vocabularyId);
      
      if (existingProgress) {
        return await apiRequest('PUT', `/api/progress/${existingProgress.id}`, {
          ...data,
          totalAttempts: (existingProgress.totalAttempts || 0) + 1,
          correctCount: data.learned ? (existingProgress.correctCount || 0) + 1 : (existingProgress.correctCount || 0),
          lastReviewed: new Date().toISOString(),
        });
      } else {
        return await apiRequest('POST', '/api/progress', {
          vocabularyId: data.vocabularyId,
          learned: data.learned || false,
          difficult: data.difficult || false,
          totalAttempts: 1,
          correctCount: data.learned ? 1 : 0,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      // Move to next word
      if (vocabulary && currentIndex < vocabulary.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!vocabulary || vocabulary.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-destructive">単語データが見つかりません</div>
      </div>
    );
  }

  const currentWord = vocabulary[currentIndex];
  const learnedCount = userProgress?.filter(p => p.learned).length || 0;
  const difficultCount = userProgress?.filter(p => p.difficult).length || 0;
  const reviewingCount = userProgress?.filter(p => !p.learned && !p.difficult).length || 0;

  const handleMarkDifficult = () => {
    markProgressMutation.mutate({
      vocabularyId: currentWord.id,
      difficult: true,
    });
  };

  const handleMarkKnown = () => {
    markProgressMutation.mutate({
      vocabularyId: currentWord.id,
      learned: true,
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Premium Status Bar */}
      <div className="premium-status-bar" />
      
      {/* Apple-Featured Grid Layout */}
      <div className="today-grid space-y-6">

      {/* Header with Language Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">単語学習 📚</h1>
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger className="w-32" data-testid="language-selector">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">🇺🇸 English</SelectItem>
            <SelectItem value="ko">🇰🇷 한국어</SelectItem>
            <SelectItem value="fr">🇫🇷 Français</SelectItem>
            <SelectItem value="zh">🇨🇳 中文</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Progress Indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">進捗</span>
            <span className="text-sm font-medium" data-testid="vocabulary-progress">
              {currentIndex + 1} / {vocabulary.length}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / vocabulary.length) * 100}%` }}
              data-testid="progress-bar"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vocabulary Card */}
      <VocabularyCard
        word={currentWord}
        language={selectedLanguage}
        onMarkDifficult={handleMarkDifficult}
        onMarkKnown={handleMarkKnown}
      />

      {/* Word Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>学習統計</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-accent" data-testid="stats-learned">
                {learnedCount}
              </div>
              <div className="text-xs text-muted-foreground">覚えた</div>
            </div>
            <div>
              <div className="text-xl font-bold text-warning" data-testid="stats-reviewing">
                {reviewingCount}
              </div>
              <div className="text-xs text-muted-foreground">復習中</div>
            </div>
            <div>
              <div className="text-xl font-bold text-destructive" data-testid="stats-difficult">
                {difficultCount}
              </div>
              <div className="text-xs text-muted-foreground">苦手</div>
            </div>
          </div>
        </CardContent>
      </Card>

      </div>
    </div>
  );
}
