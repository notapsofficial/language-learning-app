import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import { analyzePronunciation, getSpeechLanguageCode } from '@/lib/speech-utils';
import type { Vocabulary, PronunciationSession } from '@shared/schema';

interface PronunciationRecorderProps {
  word: Vocabulary;
  language: string;
  onSessionComplete: (session: Omit<PronunciationSession, 'id' | 'sessionDate'>) => void;
  className?: string;
}

export function PronunciationRecorder({ 
  word, 
  language, 
  onSessionComplete,
  className = ""
}: PronunciationRecorderProps) {
  const [analysisResult, setAnalysisResult] = useState<ReturnType<typeof analyzePronunciation> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const speechLang = getSpeechLanguageCode(language);
  
  const {
    transcript,
    confidence,
    isListening,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: speechSupported,
  } = useSpeechRecognition({
    language: speechLang,
    continuous: false,
    interimResults: false,
  });

  const {
    speak,
    isSupported: ttsSupported,
  } = useTextToSpeech({
    language: speechLang,
  });

  // Handle speech recognition result
  useEffect(() => {
    if (transcript && !isListening) {
      setIsAnalyzing(true);
      
      // Simulate analysis delay for better UX
      setTimeout(() => {
        const analysis = analyzePronunciation(word.english, transcript);
        setAnalysisResult(analysis);
        setIsAnalyzing(false);

        // Create pronunciation session
        const session = {
          vocabularyId: word.id,
          targetWord: word.english,
          recognizedWord: transcript,
          accuracy: analysis.accuracy,
          feedback: analysis.feedback,
          language,
        };

        onSessionComplete(session);
      }, 1000);
    }
  }, [transcript, isListening, word, language, onSessionComplete]);

  const handleToggleRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setAnalysisResult(null);
      startListening();
    }
  };

  const handlePlayExample = () => {
    if (ttsSupported) {
      speak(word.english);
    }
  };

  const getStatusMessage = () => {
    if (!speechSupported) {
      return "音声認識がサポートされていません";
    }
    if (isAnalyzing) {
      return "音声を分析中...";
    }
    if (isListening) {
      return "録音中... 話してください";
    }
    if (speechError) {
      return `エラー: ${speechError}`;
    }
    return "マイクボタンを押して発音してください";
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return "text-green-500";
    if (accuracy >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Word */}
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold mb-2" data-testid="practice-word">
            {word.english}
          </div>
          <div className="text-lg text-muted-foreground mb-4" data-testid="practice-pronunciation">
            {word.pronunciation}
          </div>
          <div className="text-sm text-muted-foreground mb-4" data-testid="practice-meaning">
            {word.meaning}
          </div>
          <Button
            variant="outline"
            onClick={handlePlayExample}
            disabled={!ttsSupported}
            data-testid="button-play-example"
          >
            <Volume2 className="w-4 h-4 mr-2" />
            お手本を聞く
          </Button>
        </CardContent>
      </Card>

      {/* Recording Interface */}
      <Card>
        <CardContent className="p-6">
          {/* Status */}
          <div className="text-center mb-6">
            <div className="text-lg font-medium mb-2" data-testid="recording-status">
              {getStatusMessage()}
            </div>
            
            {/* Audio Visualization */}
            <div className="flex justify-center space-x-1 h-8 items-end">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    isListening 
                      ? 'bg-primary animate-pulse' 
                      : 'bg-muted'
                  }`}
                  style={{
                    height: isListening 
                      ? `${Math.random() * 20 + 8}px` 
                      : '8px',
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Recording Button */}
          <div className="text-center">
            <Button
              size="lg"
              className={`w-20 h-20 rounded-full ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-primary hover:bg-primary/90'
              }`}
              onClick={handleToggleRecording}
              disabled={!speechSupported || isAnalyzing}
              data-testid="button-toggle-recording"
            >
              {isListening ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </Button>
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="mt-4 text-center">
              <div className="text-sm text-muted-foreground">認識結果:</div>
              <div className="text-lg font-medium" data-testid="recognized-text">
                {transcript}
              </div>
              <div className="text-sm text-muted-foreground">
                信頼度: {Math.round(confidence * 100)}%
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Result */}
      {analysisResult && (
        <Card data-testid="pronunciation-result">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              発音結果
              <span className={`text-2xl font-bold ${getAccuracyColor(analysisResult.accuracy)}`}>
                {analysisResult.accuracy}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Word Comparison */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">目標:</span>
                <span className="font-mono" data-testid="target-word">
                  {analysisResult.targetWord}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">あなた:</span>
                <span className="font-mono" data-testid="recognized-word">
                  {analysisResult.recognizedWord}
                </span>
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-muted/50 border border-border rounded-lg p-3">
              <div className="text-sm font-medium mb-1">
                フィードバック:
              </div>
              <div className="text-sm text-muted-foreground" data-testid="pronunciation-feedback">
                {analysisResult.feedback}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
