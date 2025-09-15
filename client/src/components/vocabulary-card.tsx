import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, RotateCcw, Play, Pause } from 'lucide-react';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import { getSpeechLanguageCode } from '@/lib/speech-utils';
import type { Vocabulary } from '@shared/schema';

interface VocabularyCardProps {
  word: Vocabulary;
  language: string;
  onMarkDifficult: () => void;
  onMarkKnown: () => void;
  className?: string;
}

export function VocabularyCard({ 
  word, 
  language, 
  onMarkDifficult, 
  onMarkKnown,
  className = ""
}: VocabularyCardProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [autoTimer, setAutoTimer] = useState<NodeJS.Timeout | null>(null);
  const { speak, isSupported: ttsSupported } = useTextToSpeech({
    language: getSpeechLanguageCode(language),
  });

  // Reset translation state when word changes
  useEffect(() => {
    setShowTranslation(false);
    if (autoTimer) {
      clearTimeout(autoTimer);
    }
    
    // Auto mode: show translation after 3 seconds
    if (autoMode) {
      const timer = setTimeout(() => {
        setShowTranslation(true);
      }, 3000);
      setAutoTimer(timer);
    }
  }, [word.id, autoMode]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoTimer) {
        clearTimeout(autoTimer);
      }
    };
  }, [autoTimer]);

  const handleToggleTranslation = () => {
    if (!autoMode) {
      setShowTranslation(!showTranslation);
    }
  };

  const handleToggleMode = () => {
    setAutoMode(!autoMode);
    setShowTranslation(false);
    if (autoTimer) {
      clearTimeout(autoTimer);
    }
  };

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (ttsSupported) {
      speak(word.english);
    }
  };

  const getTranslation = () => {
    switch (language) {
      case 'ko': return word.korean || word.japanese;
      case 'fr': return word.french || word.japanese;
      case 'zh': return word.chinese || word.japanese;
      default: return word.japanese;
    }
  };

  return (
    <div className={`relative h-80 ${className}`}>
      {/* Mode Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        className="absolute top-2 left-2 z-20 text-xs backdrop-blur-sm"
        onClick={handleToggleMode}
        data-testid="button-toggle-mode"
      >
        {autoMode ? '自動' : '手動'}
      </Button>

      <div 
        className="vocabulary-card-fade w-full h-full relative cursor-pointer"
        onClick={handleToggleTranslation}
        data-testid="vocabulary-card"
      >
        {/* English Side */}
        <Card className={`absolute inset-0 transition-opacity duration-500 shadow-xl apple-gradient ${
          showTranslation ? 'opacity-0' : 'opacity-100'
        }`}>
          <CardContent className="p-8 flex flex-col justify-center items-center h-full text-white relative">
            <div className="text-center relative z-10">
              <div className="text-4xl font-bold mb-4 text-shadow-lg" data-testid="word-english">
                {word.english}
              </div>
              <div className="text-lg text-white/90 mb-6 text-shadow-md" data-testid="word-pronunciation">
                {word.pronunciation}
              </div>
              <div className="text-sm text-white/80 text-shadow-sm">
                {autoMode ? '3秒後に翻訳表示' : 'タップして翻訳を表示'}
              </div>
            </div>
            
            {/* Audio Button */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30"
              onClick={handlePlayAudio}
              disabled={!ttsSupported}
              data-testid="button-play-audio"
            >
              <Volume2 className="h-4 w-4 text-white" />
            </Button>
          </CardContent>
        </Card>

        {/* Translation Side */}
        <Card className={`absolute inset-0 transition-opacity duration-500 shadow-xl apple-gradient-reverse ${
          showTranslation ? 'opacity-100' : 'opacity-0'
        }`}>
          <CardContent className="p-8 flex flex-col justify-center items-center h-full text-white relative">
            <div className="text-center relative z-10">
              <div className="text-4xl font-bold mb-4 text-shadow-lg" data-testid="word-translation">
                {getTranslation()}
              </div>
              <div className="text-lg text-white/90 mb-6 text-shadow-md" data-testid="word-meaning">
                {word.meaning}
              </div>
              <div className="text-sm text-white/80 text-shadow-sm">
                カテゴリ: {word.category}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 mt-6">
        <Button
          variant="destructive"
          className="flex-1"
          onClick={onMarkDifficult}
          data-testid="button-mark-difficult"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          難しい
        </Button>
        <Button
          variant="default"
          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={onMarkKnown}
          data-testid="button-mark-known"
        >
          <span className="mr-2">✓</span>
          覚えた
        </Button>
      </div>
    </div>
  );
}
