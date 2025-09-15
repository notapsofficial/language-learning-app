import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PronunciationRecorder } from '@/components/pronunciation-recorder';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { SkipForward } from 'lucide-react';
import type { Vocabulary, PronunciationSession } from '@shared/schema';

export default function PronunciationPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionCount, setSessionCount] = useState(1);
  const maxSessions = 5;

  const { data: vocabulary, isLoading } = useQuery<Vocabulary[]>({
    queryKey: ['/api/vocabulary'],
  });

  const { data: todaySessions } = useQuery<PronunciationSession[]>({
    queryKey: ['/api/pronunciation-sessions/today'],
  });

  const createSessionMutation = useMutation({
    mutationFn: async (session: Omit<PronunciationSession, 'id' | 'sessionDate'>) => {
      return await apiRequest('POST', '/api/pronunciation-sessions', session);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pronunciation-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      
      // Move to next session
      if (sessionCount < maxSessions) {
        setSessionCount(sessionCount + 1);
        if (vocabulary && currentIndex < vocabulary.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          setCurrentIndex(0); // Reset to beginning
        }
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
  
  const handleSessionComplete = (session: Omit<PronunciationSession, 'id' | 'sessionDate'>) => {
    createSessionMutation.mutate(session);
  };

  const handleSkipWord = () => {
    if (vocabulary && currentIndex < vocabulary.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Premium Status Bar */}
      <div className="premium-status-bar" />
      
      {/* Apple-Featured Grid Layout */}
      <div className="today-grid space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">発音練習 🎤</h1>
        <div className="text-sm bg-accent text-accent-foreground px-3 py-1 rounded-full">
          セッション <span data-testid="session-count">{sessionCount}</span>/{maxSessions}
        </div>
      </div>

      {/* Session Complete Check */}
      {sessionCount > maxSessions ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl mb-4">🎉</div>
            <h2 className="text-xl font-bold mb-2">お疲れ様でした！</h2>
            <p className="text-muted-foreground mb-4">
              今日の発音練習セッションが完了しました。
            </p>
            <Button 
              onClick={() => {
                setSessionCount(1);
                setCurrentIndex(0);
              }}
              data-testid="button-restart-session"
            >
              もう一度練習する
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Controls */}
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={handleSkipWord}
              data-testid="button-skip-word"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              この単語をスキップ
            </Button>
          </div>

          {/* Pronunciation Recorder */}
          <PronunciationRecorder
            word={currentWord}
            language="en"
            onSessionComplete={handleSessionComplete}
          />

          {/* Practice History */}
          {todaySessions && todaySessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>今日の練習</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todaySessions
                    .sort((a, b) => {
                      const dateA = a.sessionDate ? new Date(a.sessionDate).getTime() : 0;
                      const dateB = b.sessionDate ? new Date(b.sessionDate).getTime() : 0;
                      return dateB - dateA;
                    })
                    .slice(0, 5)
                    .map((session) => (
                      <div 
                        key={session.id} 
                        className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                            <span className="text-xs">🎤</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium" data-testid="history-word">
                              {session.targetWord}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {session.sessionDate 
                                ? new Date(session.sessionDate).toLocaleTimeString('ja-JP', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '--:--'
                              }
                            </div>
                          </div>
                        </div>
                        <div 
                          className={`text-sm font-bold ${
                            (session.accuracy || 0) >= 90 
                              ? 'text-green-500'
                              : (session.accuracy || 0) >= 70 
                              ? 'text-yellow-500' 
                              : 'text-red-500'
                          }`}
                          data-testid="history-score"
                        >
                          {session.accuracy || 0}%
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      </div>
    </div>
  );
}
