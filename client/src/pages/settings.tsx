import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Trash2, User, Github, Upload } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { UserSettings } from '@shared/schema';

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Partial<UserSettings>>({});

  const { data: userSettings, isLoading } = useQuery<UserSettings>({
    queryKey: ['/api/settings'],
  });

  // Update settings when userSettings data changes
  useEffect(() => {
    if (userSettings) {
      setSettings(userSettings);
    }
  }, [userSettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      return await apiRequest('PUT', '/api/settings', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "設定を更新しました",
        description: "変更が保存されました。",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "設定の更新に失敗しました。",
        variant: "destructive",
      });
    },
  });

  // GitHub repository creation mutations
  const createRepoMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      return await apiRequest('POST', '/api/github/create-repo', { name, description });
    },
    onSuccess: (data: any) => {
      toast({
        title: "レポジトリを作成しました",
        description: `${data.repo.name} が正常に作成されました。`,
      });
      // Automatically start uploading files after repo creation
      uploadFilesMutation.mutate({ 
        repoOwner: data.repo.full_name.split('/')[0], 
        repoName: data.repo.name 
      });
    },
    onError: (error: any) => {
      toast({
        title: "レポジトリ作成エラー",
        description: error.message || "レポジトリの作成に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const uploadFilesMutation = useMutation({
    mutationFn: async ({ repoOwner, repoName }: { repoOwner: string; repoName: string }) => {
      return await apiRequest('POST', '/api/github/upload', { repoOwner, repoName });
    },
    onSuccess: (data: any) => {
      toast({
        title: "アップロード完了",
        description: `${data.uploaded} ファイルをアップロードしました。`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "アップロードエラー",
        description: error.message || "ファイルのアップロードに失敗しました。",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!userSettings) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-destructive">設定データの読み込みに失敗しました</div>
      </div>
    );
  }

  const handleSettingChange = (key: keyof UserSettings, value: unknown) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    updateSettingsMutation.mutate({ [key]: value });
  };

  const handleExportData = () => {
    toast({
      title: "データをエクスポート中",
      description: "学習データの準備を開始しました。",
    });
    // In a real app, this would trigger a data export
  };

  const handleClearData = () => {
    if (window.confirm('すべての学習データを削除しますか？この操作は取り消せません。')) {
      toast({
        title: "データをリセット中",
        description: "すべての学習データを削除しています。",
        variant: "destructive",
      });
      // In a real app, this would clear all user data
    }
  };

  const handleCreateGitHubRepo = () => {
    const repoName = "language-learning-app";
    const description = "Apple-featured quality language learning app with vocabulary practice and pronunciation training";
    
    createRepoMutation.mutate({ name: repoName, description });
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Premium Status Bar */}
      <div className="premium-status-bar" />
      
      {/* Apple-Featured Grid Layout */}
      <div className="today-grid space-y-6">

      {/* Header */}
      <h1 className="text-2xl font-bold">設定 ⚙️</h1>

      {/* User Profile */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <div className="text-lg font-semibold" data-testid="user-name">
                学習者
              </div>
              <div className="text-sm text-muted-foreground" data-testid="user-level">
                中級学習者
              </div>
            </div>
          </div>
          <Button 
            variant="secondary" 
            className="w-full"
            data-testid="button-edit-profile"
          >
            プロフィールを編集
          </Button>
        </CardContent>
      </Card>

      {/* Learning Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>学習設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Daily Goal */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">1日の目標単語数</div>
              <div className="text-xs text-muted-foreground">毎日学習する単語の数を設定</div>
            </div>
            <Select 
              value={settings.dailyGoal?.toString() || '20'} 
              onValueChange={(value) => handleSettingChange('dailyGoal', parseInt(value))}
            >
              <SelectTrigger className="w-20" data-testid="select-daily-goal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10語</SelectItem>
                <SelectItem value="20">20語</SelectItem>
                <SelectItem value="50">50語</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notification */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">学習リマインダー</div>
              <div className="text-xs text-muted-foreground">毎日の学習時間をお知らせ</div>
            </div>
            <Switch
              checked={settings.notifications ?? true}
              onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
              data-testid="switch-notifications"
            />
          </div>

          {/* Auto-play Audio */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">音声自動再生</div>
              <div className="text-xs text-muted-foreground">単語カード表示時に音声を再生</div>
            </div>
            <Switch
              checked={settings.autoplay ?? false}
              onCheckedChange={(checked) => handleSettingChange('autoplay', checked)}
              data-testid="switch-autoplay"
            />
          </div>
        </CardContent>
      </Card>

      {/* App Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>アプリ設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">テーマ</div>
              <div className="text-xs text-muted-foreground">アプリの外観を選択</div>
            </div>
            <Select 
              value={settings.theme || 'auto'} 
              onValueChange={(value) => handleSettingChange('theme', value)}
            >
              <SelectTrigger className="w-24" data-testid="select-theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">ライト</SelectItem>
                <SelectItem value="dark">ダーク</SelectItem>
                <SelectItem value="auto">自動</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">表示言語</div>
              <div className="text-xs text-muted-foreground">アプリの表示言語</div>
            </div>
            <Select 
              value={settings.appLanguage || 'ja'} 
              onValueChange={(value) => handleSettingChange('appLanguage', value)}
            >
              <SelectTrigger className="w-24" data-testid="select-app-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* GitHub Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Github className="w-5 h-5 mr-2" />
            GitHubにアップロード
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            この言語学習アプリをGitHubリポジトリとして保存します。Apple-featured品質のコードと美しいUIデザインを共有できます。
          </p>
          
          <Button 
            variant="default" 
            className="w-full justify-center bg-[#24292e] text-white hover:bg-[#1b1f23]"
            onClick={handleCreateGitHubRepo}
            disabled={createRepoMutation.isPending || uploadFilesMutation.isPending}
            data-testid="button-create-github-repo"
          >
            {createRepoMutation.isPending ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                レポジトリ作成中...
              </>
            ) : uploadFilesMutation.isPending ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                ファイルアップロード中...
              </>
            ) : (
              <>
                <Github className="w-4 h-4 mr-2" />
                GitHubレポジトリを作成
              </>
            )}
          </Button>
          
          <div className="text-xs text-muted-foreground">
            レポジトリ名: language-learning-app<br/>
            公開レポジトリとして作成され、すべてのプロジェクトファイルがアップロードされます。
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>データとプライバシー</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleExportData}
            data-testid="button-export-data"
          >
            <Download className="w-4 h-4 mr-2" />
            データのエクスポート
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleClearData}
            data-testid="button-clear-data"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            データをリセット
          </Button>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>アプリについて</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>バージョン</span>
              <span data-testid="app-version">1.2.0</span>
            </div>
            <div className="flex justify-between">
              <span>ビルド</span>
              <span data-testid="app-build">2024.1.15</span>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start p-0 h-auto text-primary"
              data-testid="button-contact-support"
            >
              サポートに問い合わせ
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start p-0 h-auto text-primary"
              data-testid="button-rate-app"
            >
              アプリを評価
            </Button>
          </div>
        </CardContent>
      </Card>

      </div>
    </div>
  );
}
