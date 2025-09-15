import SwiftUI
import UIKit
import AVFoundation

// MARK: - Word Display Screen (Flutterアプリのメイン画面を再現)
struct WordDisplayScreen: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.colorScheme) var colorScheme
    @State private var showResetConfirmation = false
    // @State private var showAppleIntelligence = false  // 一時的に無効化
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // 背景色
                Color(.systemBackground)
                    .ignoresSafeArea()
                    .animation(.easeInOut(duration: 1.2), value: appState.currentTheme)
                
                // 単語表示を絶対的な中央に固定
                MainContent()
                    .position(
                        x: geometry.size.width / 2,
                        y: geometry.size.height / 2
                    )
                
                // 上部の設定アイコンバー（オーバーレイ）
                VStack {
                    if appState.showOverlayIcons {
                        TopIconBar()
                            .transition(.opacity)
                    }
                    Spacer()
                }
                
                // 下部のコントロール（オーバーレイ）
                GeometryReader { geo in
                    let isLandscape = geo.size.width > geo.size.height
                    let screenHeight = geo.size.height
                    
                    if appState.showOverlayIcons || appState.isOntapsMode {
                        Group {
                            // 自動/手動モード切り替えとスライダー
                            HStack(spacing: 16) {
                                // モード切り替えボタン
                                ModeToggleButton()
                                
                                Spacer()
                                
                                // スライダーまたは矢印ボタン
                                if appState.isOntapsMode {
                                    ArrowControls()
                                } else {
                                    IntervalSlider()
                                }
                            }
                            .padding(.horizontal, 16)
                            .position(
                                x: geo.size.width / 2,
                                y: isLandscape ? 
                                    screenHeight - 75 :  // 横置き：AUTOとスピード調整バーを画面下端から75pt上
                                    screenHeight - 100   // 縦置き：画面下端から100pt上
                            )
                            
                            // 進捗ゲージ（常に表示）
                            ProgressGauge()
                                .padding(.horizontal, 20)
                                .position(
                                    x: geo.size.width / 2,
                                    y: isLandscape ? 
                                        screenHeight - 20 :  // 横置き：進捗バーを画面下端から20pt上
                                        screenHeight - 40    // 縦置き：進捗バーを画面下端から40pt上
                                )
                        }
                        .transition(.opacity)
                    }
                }
                
                // 履歴パネル
                if appState.showHistory {
                    HistoryPanel()
                        .transition(.move(edge: .top))
                }
                
                // チュートリアル
                if appState.showTutorial {
                    TutorialOverlay()
                }
            }
        }
        .onTapGesture {
            UISelectionFeedbackGenerator().selectionChanged()
            appState.resetOverlayIconsVisibility()
        }
        .gesture(
            DragGesture()
                .onEnded { value in
                    if abs(value.translation.width) > 200 && !appState.currentWordPairs.isEmpty {
                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                        let currentWord = appState.currentWordPairs[appState.currentIndex]
                        
                        if appState.currentLevel == .review {
                            appState.removeReviewWord(currentWord.id)
                            showToast(message: "復習リストから削除しました")
                        } else if appState.currentLevel != .quo {
                            appState.addReviewWord(currentWord.id)
                            showToast(message: "Lv.Reに移動しました")
                        }
                    }
                }
        )
        .buttonStyle(.plain)
        .alert("進捗のリセット", isPresented: $showResetConfirmation) {
            Button("いいえ", role: .cancel) { }
            Button("はい") {
                resetProgressForCurrentLevel()
            }
        } message: {
            Text("このレベルの学習進捗をリセットしますか？")
        }
        // Apple Intelligence機能のシート（iOS 26+）
        // 一時的に無効化 - 実機テスト優先
        /*
        .sheet(isPresented: $showAppleIntelligence) {
            if #available(iOS 19.0, *) {
                AppleIntelligenceView()
            } else {
                Text("iOS 19.0以降が必要です")
            }
        }
        */
    }
    
    private func showToast(message: String) {
        // トースト表示の実装
    }
    
    private func resetProgressForCurrentLevel() {
        if appState.currentLevel == .review || appState.currentLevel == .quo { return }
        
        let key = "viewedWords_\(appState.currentLevel.rawValue)"
        UserDefaults.standard.removeObject(forKey: key)
        appState.updateProgress()
    }
}

// MARK: - Top Icon Bar
struct TopIconBar: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.horizontalSizeClass) var horizontalSizeClass
    @State private var showSpeechSettings = false
    @State private var showThemePopover = false
    
    var body: some View {
        GeometryReader { geometry in
            let isLandscape = geometry.size.width > geometry.size.height
            
            VStack(spacing: 8) {
                // メインアイコンバー - 中央配置（左端にヘルプの星）
                HStack {
                    Spacer(minLength: 0)
                    HStack(spacing: isLandscape ? 22 : (horizontalSizeClass == .compact ? 12 : 16)) {
                        // ヘルプ
                        IconButton(
                            icon: "star.fill",
                            action: {
                                if let url = URL(string: "https://important-skate-43b.notion.site/notaps-1e703ddb2323804dbcf5c7214aa49a3c") {
                                    UIApplication.shared.open(url)
                                }
                            }
                        )
                        // レベル切り替え
                        IconButton(
                            icon: appState.currentLevel.displayName,
                            isText: true,
                            action: {
                                appState.cycleLevel()
                            }
                        )
                        
                        // 学習言語選択
                        LanguageSelectionIcon()
                        
                        // （統合により削除）A→あ / 漢 は調整メニューへ移動
                        
                        // 音声設定
                        IconButton(
                            icon: appState.isMuted ? "speaker.slash" : (getSpeechModeText().isEmpty ? languageAbbreviation(appState.currentLanguage) : getSpeechModeText()),
                            isText: !appState.isMuted,
                            action: {
                                appState.updateSpeechMode()
                            }
                        )
                        
                        // 音声速度設定
                        IconButton(
                            icon: "slider.horizontal.3",
                            action: {
                                showSpeechSettings = true
                            }
                        )
                        
                        // Plan B: 軽量ポップオーバー
                        Button {
                            showThemePopover = true
                        } label: {
                            Image(systemName: "paintpalette")
                                .font(.system(size: horizontalSizeClass == .compact ? 18 : 20, weight: .semibold))
                                .foregroundStyle(GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count])
                                .frame(width: horizontalSizeClass == .compact ? 40 : 44, height: horizontalSizeClass == .compact ? 40 : 44)
                                .background(
                                    Circle()
                                        .fill(Color(.systemGray6))
                                        .opacity(0.8)
                                )
                        }
                        .buttonStyle(.plain)
                        .popover(
                            isPresented: $showThemePopover,
                            attachmentAnchor: .rect(.bounds),
                            arrowEdge: .top
                        ) {
                            ThemePalettePopover(
                                theme: appState.currentTheme,
                                gradientIndex: appState.gradientIndex,
                                onSelectTheme: { t in appState.setTheme(t, gradientIndex: appState.gradientIndex) },
                                onSelectGradient: { gi in appState.setTheme(appState.currentTheme, gradientIndex: gi) },
                                onClose: {
                                    showThemePopover = false
                                }
                            )
                            .presentationCompactAdaptation(.popover)
                        }
                        .onChange(of: showThemePopover) { _, open in
                            if open { appState.pauseAuto() } else { appState.resumeAuto() }
                        }
                    }
                    Spacer(minLength: 0)
                }
            }
        }
        .padding(.top, horizontalSizeClass == .compact ? 50 : 60)
        .background(Color.clear)
        .sheet(isPresented: $showSpeechSettings) {
            SpeechSettingsView()
        }
    }
    
    private func getDisplayModeShortName() -> String {
        if appState.currentLevel == .business {
            return ["漢", "漢あ"][appState.displayModeIndex % 2]
        } else {
            return ["漢", "漢あ", "あA"][appState.displayModeIndex % 3]
        }
    }
    
    private func getSpeechModeIcon() -> String {
        if appState.isMuted {
            return "speaker.slash" // Mute
        } else {
            switch appState.speechMode {
            case 1: return "speaker.wave.1" // English only
            case 2: return "speaker.wave.2" // Japanese only
            case 3: return "speaker.wave.3" // Both English and Japanese
            default: return "speaker.slash"
            }
        }
    }
    
    private func getSpeechModeText() -> String {
        print("🔍 getSpeechModeText: isMuted=\(appState.isMuted), speechMode=\(appState.speechMode)")
        if appState.isMuted {
            return "" // ミュート時は空文字（アイコンが表示される）
        } else {
            let sel = languageAbbreviation(appState.currentLanguage)
            switch appState.speechMode {
            case 1: return sel
            case 2: return "JP"
            case 3: return "\(sel)JP"
            default:
                print("⚠️ getSpeechModeText: Unknown speechMode=\(appState.speechMode), defaulting to \(sel)")
                return sel
            }
        }
    }

    private func languageAbbreviation(_ language: Language) -> String {
        switch language {
        case .english: return "EN"
        case .japanese: return "JP"
        case .korean: return "KO"
        case .french: return "FR"
        case .chinese: return "ZH"
        }
    }
    
    // 旧ダーク/テーマアイコンは統合により削除
}

// MARK: - Unified Theme Menu
struct ThemeMenuButton: View, Equatable {
    let theme: AppTheme
    let gradientIndex: Int
    let setTheme: (AppTheme) -> Void
    let setGradient: (Int) -> Void
    
    @Environment(\.horizontalSizeClass) var horizontalSizeClass
    @State private var paletteCache: [Int: UIImage] = [:]
    @State private var isOpen: Bool = false
    @State private var frozenIndices: [Int] = []
    @State private var frozenSelected: Int? = nil

    static func == (lhs: ThemeMenuButton, rhs: ThemeMenuButton) -> Bool {
        lhs.theme == rhs.theme && lhs.gradientIndex == rhs.gradientIndex
    }
    
    // 表示名と対応するグラデーションIndex（実際の配色に対応）
    private let themedOptions: [(title: String, index: Int)] = [
        ("ルビーレッド", 6),
        ("サファイアブルー", 1),
        ("サンフラワーイエロー", 7),
        ("エメラルドグリーン", 0),
        ("フューシャピンク", 4)
    ]
    private var colorIndices: [Int] { themedOptions.map { $0.index } }

    // グラデーションを画像化してMenu内でも確実に表示できるアイコンに変換
    private func paletteImage(for gradientIndex: Int, size: CGSize = CGSize(width: 46, height: 22), circle: Bool = false) -> Image {
        if let cached = paletteCache[cacheKey(gradientIndex: gradientIndex, size: size, circle: circle)] {
            return Image(uiImage: cached).renderingMode(.original)
        }
        if #available(iOS 16.0, *) {
            let shape: AnyView = circle
                ? AnyView(Circle().fill(GradientPreset.gradients[gradientIndex % GradientPreset.gradients.count]))
                : AnyView(RoundedRectangle(cornerRadius: 6, style: .continuous).fill(GradientPreset.gradients[gradientIndex % GradientPreset.gradients.count]))
            let content = shape.frame(width: size.width, height: size.height)
            let renderer = ImageRenderer(content: content)
            renderer.scale = UIScreen.main.scale
            if let uiImage = renderer.uiImage {
                paletteCache[cacheKey(gradientIndex: gradientIndex, size: size, circle: circle)] = uiImage
                return Image(uiImage: uiImage).renderingMode(.original)
            }
        }
        // フォールバック（単色UIImageを生成）
        let fallbackColor = UIColor(sampleColor(for: gradientIndex))
        UIGraphicsBeginImageContextWithOptions(size, false, UIScreen.main.scale)
        let rect = CGRect(origin: .zero, size: size)
        let path: UIBezierPath = circle
            ? UIBezierPath(ovalIn: rect)
            : UIBezierPath(roundedRect: rect, cornerRadius: 6)
        fallbackColor.setFill()
        path.fill()
        let uiImage = UIGraphicsGetImageFromCurrentImageContext() ?? UIImage()
        UIGraphicsEndImageContext()
        paletteCache[cacheKey(gradientIndex: gradientIndex, size: size, circle: circle)] = uiImage
        return Image(uiImage: uiImage).renderingMode(.original)
    }

    private func cacheKey(gradientIndex: Int, size: CGSize, circle: Bool) -> Int {
        var hasher = Hasher()
        hasher.combine(gradientIndex)
        hasher.combine(Int(size.width))
        hasher.combine(Int(size.height))
        hasher.combine(circle)
        return hasher.finalize()
    }
    
    // ラベル色用の代表色（グラデーション先頭色を使用）
    private func sampleColor(for index: Int) -> Color {
        // 代表色として先頭のColorを使用するための近似。LinearGradientから直接は取り出せないため、固定色マップで代用
        switch index % GradientPreset.gradients.count {
        case 0: return Color(red: 0.20, green: 0.78, blue: 0.35)
        case 1: return Color(red: 0.00, green: 0.48, blue: 1.00)
        case 2: return Color(red: 0.58, green: 0.15, blue: 0.65)
        case 3: return Color(red: 1.00, green: 0.58, blue: 0.00)
        case 4: return Color(red: 1.00, green: 0.18, blue: 0.33)
        case 5: return Color(red: 0.00, green: 0.58, blue: 0.58)
        case 6: return Color(red: 1.00, green: 0.23, blue: 0.19)
        default: return Color(red: 1.00, green: 0.80, blue: 0.00)
        }
    }
    
    var body: some View {
        Menu {
            // 上部: テーマ（ライト/ダーク）の2択を横並びで（セグメント）
            Picker("", selection: Binding(
                get: { theme },
                set: { setTheme($0) }
            )) {
                Text("ライト").tag(AppTheme.light)
                Text("ダーク").tag(AppTheme.dark)
            }
            .pickerStyle(.segmented)
            
            // 下部: カラーテーマ（メニュー開時に凍結したデータのみを使用）
            Section(header: Text("カラー")) {
                ForEach(frozenIndices, id: \.self) { gi in
                    let title = themedOptions.first(where: { $0.index == gi })?.title ?? ""
                    colorSwatchRow(gradientIndex: gi, title: title)
                }
            }
            .transaction { $0.animation = nil }
        } label: {
            Image(systemName: "paintbrush.pointed.fill")
                .font(.system(size: horizontalSizeClass == .compact ? 18 : 20, weight: .semibold))
                .foregroundStyle(GradientPreset.gradients[gradientIndex % GradientPreset.gradients.count])
                .frame(width: horizontalSizeClass == .compact ? 40 : 44, height: horizontalSizeClass == .compact ? 40 : 44)
                .background(
                    Circle()
                        .fill(Color(.systemGray6))
                        .opacity(0.8)
                )
        }
        .id(isOpen)
        .menuStyle(.automatic)
    }
    
    // (旧) テーマ切替行はPickerで代替したため削除
    
    // カラースウォッチ（1行1色・行全体がタップ対象）
    @ViewBuilder
    private func colorSwatchRow(gradientIndex: Int, title: String) -> some View {
        let isSelected = (frozenSelected ?? self.gradientIndex) % GradientPreset.gradients.count == (gradientIndex % GradientPreset.gradients.count)
        Button(action: {
            setGradient(gradientIndex)
            frozenSelected = gradientIndex
            isOpen = false
        }) {
            HStack(spacing: 10) {
                // 左詰めの円形スウォッチ（点滅対策: メニュー内の暗黙アニメーション無効化）
                paletteImage(for: gradientIndex, size: CGSize(width: 24, height: 24), circle: true)
                    .resizable()
                    .frame(width: 24, height: 24)
                Spacer(minLength: 6)
                if isSelected {
                    Image(systemName: "checkmark")
                        .foregroundColor(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, 4)
            .padding(.leading, -12)
        }
        .transaction { $0.animation = nil }
        .buttonStyle(.plain)
        .accessibilityLabel(Text(title))
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
    
    // メニューを開く前に凍結
    private func freezeIfNeeded() {
        if !isOpen {
            frozenIndices = colorIndices
            frozenSelected = gradientIndex
            isOpen = true
        }
    }
}

// MARK: - Plan B Popover Content
private struct ThemePalettePopover: View {
    let theme: AppTheme
    let gradientIndex: Int
    let onSelectTheme: (AppTheme) -> Void
    let onSelectGradient: (Int) -> Void
    let onClose: () -> Void

    private let titles: [(String, AppTheme)] = [("ライト", .light), ("ダーク", .dark)]
    private let palette: [(String, Int)] = [
        ("サンセット", 8), ("インディゴブルーム", 9), ("シーフォーム", 10), ("ベイビーピンク", 11),
        ("ルビーレッド", 6), ("サファイアブルー", 1), ("サンフラワーイエロー", 7), ("エメラルドグリーン", 0), ("フューシャピンク", 4)
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // 縦並び: ライト / ダーク（アイコンのみで省幅）
            VStack(alignment: .center, spacing: 4) {
                ForEach(titles, id: \.1) { t in
                    let selected = (theme == t.1)
                    Button { onSelectTheme(t.1) } label: {
                        Image(systemName: t.1 == .light ? "sun.max.fill" : "moon.fill")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundStyle(selected ? Color.primary : Color.secondary)
                            .frame(width: 30, height: 30)
                            .background(
                                Circle()
                                    .strokeBorder(selected ? Color.accentColor : Color.clear, lineWidth: 2)
                            )
                            .contentShape(Rectangle())
                            .animation(.easeInOut(duration: 0.25), value: selected)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(Text(t.0))
                    .frame(maxWidth: .infinity, alignment: .center)
                }
            }
            .padding(.bottom, 4)

            Divider()

            // 縦並び: カラー（名前を表示しない細いパレット）
            VStack(alignment: .center, spacing: 6) {
                ForEach(palette, id: \.1) { item in
                    let gi = item.1
                    Button {
                        onSelectGradient(gi)
                    } label: {
                        HStack(spacing: 8) {
                            let selected = (gradientIndex % GradientPreset.gradients.count) == (gi % GradientPreset.gradients.count)
                            Circle()
                                .fill(GradientPreset.gradients[gi % GradientPreset.gradients.count])
                                .frame(width: 20, height: 20)
                                .overlay(
                                    Circle().stroke(selected ? Color.accentColor : Color.secondary.opacity(0.25), lineWidth: selected ? 2 : 0.5)
                                )
                        }
                        .frame(maxWidth: .infinity, alignment: .center)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
            }

            // 余白なし（ボタンは上部に移動済み）
        }
        .padding(.top, 4)
        .padding(.bottom, 6)
        .padding(.horizontal, 12)
        .frame(minWidth: 76, maxWidth: 86)
    }
}

// MARK: - Main Content
struct MainContent: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        Group {
            if appState.currentWordPairs.isEmpty {
                EmptyStateView()
            } else {
                WordDisplayView()
            }
        }
        .onTapGesture {
            UISelectionFeedbackGenerator().selectionChanged()
            appState.toggleHistoryMode()
        }
    }
}

// MARK: - Empty State View
struct EmptyStateView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.horizontalSizeClass) var horizontalSizeClass
    
    var body: some View {
        VStack(spacing: 20) {
            if appState.currentLevel == .review {
                Text("復習リストは空です。\n単語を横にスワイプして追加できます。")
                    .multilineTextAlignment(.center)
                    .font(.title3)
                    .foregroundColor(.secondary)
            } else {
                Text("このレベルの単語はありません。")
                    .multilineTextAlignment(.center)
                    .font(.title3)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.horizontal, horizontalSizeClass == .compact ? 20 : 32)
        .padding(.vertical, 40)
    }
}

// MARK: - Word Display View
struct WordDisplayView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.horizontalSizeClass) var horizontalSizeClass
    
    var body: some View {
        GeometryReader { geometry in
            let isLandscape = geometry.size.width > geometry.size.height
            
            VStack(spacing: 24) {
                if !isLandscape {
                    // 縦向き表示
                    if appState.currentLevel == .quo {
                        Text("賢者の名言は\n横置きで見てください")
                            .font(.title2)
                            .fontWeight(.semibold)
                            .multilineTextAlignment(.center)
                            .foregroundColor(.secondary)
                    } else {
                        if appState.isContentVisible {
                            Group {
                                if appState.showEnglish {
                                    Text(appState.currentLanguageWord.isEmpty ? "Loading..." : appState.currentLanguageWord)
                                        .font(.system(size: 48, weight: .bold, design: .default))
                                        .fontWeight(.bold)
                                        .multilineTextAlignment(.center)
                                        .foregroundStyle(
                                            GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
                                        )
                                } else {
                                    // 中央の単語表示で確実に日本語を出す
                                    Text(appState.currentJapaneseWord)
                                        .font(.system(size: 48, weight: .bold, design: .default))
                                        .fontWeight(.bold)
                                        .multilineTextAlignment(.center)
                                        .foregroundStyle(
                                            GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
                                        )
                                }
                            }
                            .id("\(appState.currentIndex)_\(appState.showEnglish)")
                            .transition(.opacity)
                        }
                    }
                } else {
                    // 横向き表示（例文モード）
                    if appState.isContentVisible {
                        Group {
                            if appState.currentLevel == .quo {
                                QuoteSentenceView()
                            } else {
                                SentenceExampleView()
                            }
                        }
                        .id("\(appState.currentIndex)_\(appState.showEnglish)_landscape")
                        .transition(.opacity)
                    }
                }
            }
            .padding(.horizontal, isLandscape ? 32 : 20)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .animation(.easeInOut(duration: 0.3), value: appState.currentIndex)
            .animation(.easeInOut(duration: 0.3), value: appState.showEnglish)
            .onChange(of: isLandscape) { _, newValue in
                appState.isLandscape = newValue
            }
            .onAppear {
                appState.isLandscape = isLandscape
            }
        }
    }
    
    private var currentWord: Word {
        appState.currentWordPairs[appState.currentIndex]
    }
    

}

// MARK: - Japanese Display View
struct JapaneseDisplayView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        guard !appState.currentWordPairs.isEmpty,
              appState.currentIndex >= 0,
              appState.currentIndex < appState.currentWordPairs.count else {
            return AnyView(
                Text("読み込み中...")
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            )
        }
        let currentWord = appState.currentWordPairs[appState.currentIndex]
        
        return AnyView(
            Group {
                if appState.currentLevel == .business {
                    BusinessDisplayView(word: currentWord)
                } else {
                    StandardDisplayView(word: currentWord)
                }
            }
        )
    }
}

// MARK: - Business Display View
struct BusinessDisplayView: View {
    let word: Word
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        VStack(spacing: 16) {
            Text(word.kanji.replacingOccurrences(of: "（", with: "\n（"))
                .font(.system(size: 48, weight: .bold, design: .default))
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
                .foregroundStyle(
                    GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
                )
            
            if appState.displayModeIndex % 2 == 1 {
                Text(word.meaning)
                    .font(.title3)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
                    .foregroundStyle(
                        GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
                    )
            }
        }
    }
}

// MARK: - Standard Display View
struct StandardDisplayView: View {
    let word: Word
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        Group {
            switch appState.displayModeIndex % 3 {
            case 0:
                Text(word.kanji)
                    .font(.system(size: 48, weight: .bold, design: .default))
                    .fontWeight(.bold)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(
                        GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
                    )
            case 1:
                VStack(spacing: 16) {
                    Text(word.kanji)
                        .font(.system(size: 48, weight: .bold, design: .default))
                        .fontWeight(.bold)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(
                            GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
                        )
                    Text(word.hiragana)
                        .font(.system(size: 48, weight: .bold, design: .default))
                        .multilineTextAlignment(.center)
                        .foregroundStyle(
                            GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
                        )
                }
            case 2:
                VStack(spacing: 16) {
                    Text(word.hiragana)
                        .font(.system(size: 48, weight: .bold, design: .default))
                        .multilineTextAlignment(.center)
                        .foregroundStyle(
                            GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
                        )
                    Text(word.romaji)
                        .font(.system(size: 48, weight: .bold, design: .default))
                        .multilineTextAlignment(.center)
                        .foregroundStyle(
                            GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
                        )
                }
            default:
                EmptyView()
            }
        }
    }
}

// MARK: - Quote Sentence View
struct QuoteSentenceView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.horizontalSizeClass) var horizontalSizeClass
    
    var body: some View {
        // 安全に現在の単語を取得（空配列/範囲外を回避）
        guard let currentWord = appState.currentWord else {
            return AnyView(
                Text("読み込み中...")
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            )
        }
        let text = (appState.showEnglishFirst ? appState.showEnglish : !appState.showEnglish) ? currentWord.sentenceEnglish : currentWord.sentenceJapanese
        
        return AnyView(
            VStack(spacing: 24) {
                buildQuoteContent(text)
            }
            .padding(.horizontal, horizontalSizeClass == .compact ? 20 : 32)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        )
    }
    
    private func buildQuoteContent(_ text: String) -> some View {
        let (quote, author) = parseQuoteText(text)
        
        return VStack(spacing: 16) {
            // 引用文
            Text(quote)
                .font(.largeTitle)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
                .lineSpacing(12)
                .fixedSize(horizontal: false, vertical: true)
                .foregroundStyle(
                    GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
                )
            
            // 著者名
            if !author.isEmpty {
                Text(author)
                    .font(.title3)
                    .fontWeight(.semibold)
                    .multilineTextAlignment(.center)
                    .foregroundColor(.secondary)
                    .italic()
            }
        }
    }
    
    private func parseQuoteText(_ text: String) -> (quote: String, author: String) {
        // 引用文のフォーマット処理（Flutterファイルと同様）
        let pattern = "(.*?)([\\s\\u3000]*[-–ー][\\s\\u3000]*[^\\n]+)$"
        if let regex = try? NSRegularExpression(pattern: pattern),
           let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
           let quoteRange = Range(match.range(at: 1), in: text),
           let authorRange = Range(match.range(at: 2), in: text) {
            let beforeQuote = String(text[quoteRange]).trimmingCharacters(in: .whitespacesAndNewlines)
            let author = String(text[authorRange]).trimmingCharacters(in: .whitespacesAndNewlines)
            return (beforeQuote, author)
        }
        return (text, "")
    }
}

// MARK: - Sentence Example View
struct SentenceExampleView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        guard !appState.currentWordPairs.isEmpty,
              appState.currentIndex >= 0,
              appState.currentIndex < appState.currentWordPairs.count else {
            return AnyView(
                Text("読み込み中...")
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            )
        }
        let currentWord = appState.currentWordPairs[appState.currentIndex]
        
        return AnyView(
            VStack(spacing: 16) {
                if appState.showEnglishFirst ? appState.showEnglish : !appState.showEnglish {
                    EnglishSentenceView(
                        sentence: currentWord.sentenceEnglish,
                        targetWord: currentWord.english
                    )
                } else {
                    JapaneseSentenceView(
                        sentence: currentWord.sentenceJapanese,
                        targetWord: currentWord.kanji
                    )
                }
            }
            .padding(.horizontal, 32)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        )
    }
}

// MARK: - English Sentence View
struct EnglishSentenceView: View {
    let sentence: String
    let targetWord: String
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        if sentence.isEmpty || targetWord.isEmpty || !sentence.contains(targetWord) {
            Text(sentence)
                .font(.largeTitle)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
                .lineSpacing(12)
                .fixedSize(horizontal: false, vertical: true)
                .foregroundStyle(
                    GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
                )
        } else {
            buildHighlightedText()
        }
    }
    
    private func buildHighlightedText() -> some View {
        let parts = sentence.components(separatedBy: targetWord)
        
        return VStack(spacing: 8) {
            // 英語例文をハイライト表示
            (Text(parts.first ?? "") +
             Text(targetWord).fontWeight(.heavy) +
             Text(parts.dropFirst().joined(separator: targetWord)))
                .font(.largeTitle)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
                .lineSpacing(12)
                .fixedSize(horizontal: false, vertical: true)
                .foregroundStyle(
                    GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
                )
        }
    }
}

// MARK: - Japanese Sentence View
struct JapaneseSentenceView: View {
    let sentence: String
    let targetWord: String
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        if sentence.isEmpty || targetWord.isEmpty || !sentence.contains(targetWord) {
            Text(sentence)
                .font(.largeTitle)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
                .lineSpacing(12)
                .fixedSize(horizontal: false, vertical: true)
                .foregroundStyle(
                    GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
                )
        } else {
            buildHighlightedText()
        }
    }
    
    private func buildHighlightedText() -> some View {
        let parts = sentence.components(separatedBy: targetWord)
        
        return VStack(spacing: 8) {
            // 日本語例文をハイライト表示
            (Text(parts.first ?? "") +
             Text(targetWord).fontWeight(.heavy) +
             Text(parts.dropFirst().joined(separator: targetWord)))
                .font(.largeTitle)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
                .lineSpacing(12)
                .fixedSize(horizontal: false, vertical: true)
                .foregroundStyle(
                    GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
                )
        }
    }
}

// MARK: - Bottom Controls (現在は直接WordDisplayScreen内に配置)

// MARK: - Mode Toggle Button
struct ModeToggleButton: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        Button(action: {
            appState.toggleAutoMode()
        }) {
            Text(appState.isOntapsMode ? "Manual" : "Auto")
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundStyle(appState.isOntapsMode ? AnyShapeStyle(getCurrentGradient()) : AnyShapeStyle(Color.white))
                .frame(width: 100, height: 44)
                .background(
                    Group {
                        if appState.isOntapsMode {
                            RoundedRectangle(cornerRadius: 22)
                                .fill(Color(.systemBackground))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 22)
                                        .stroke(getCurrentGradient(), lineWidth: 2)
                                )
                        } else {
                            RoundedRectangle(cornerRadius: 22)
                                .fill(getCurrentGradient())
                        }
                    }
                )
        }
        .buttonStyle(.plain)
    }
    
    private func getCurrentGradient() -> LinearGradient {
        GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
    }
}

// MARK: - Arrow Controls
struct ArrowControls: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        HStack(spacing: 24) {
            Button(action: {
                appState.previousWord()
            }) {
                Image(systemName: "chevron.left")
                    .font(.title)
                    .foregroundStyle(getCurrentGradient())
                    .frame(width: 52, height: 52)
                    .background(
                        Circle()
                            .fill(Color(.systemGray6))
                            .opacity(0.8)
                    )
            }
            
            Button(action: {
                appState.nextWord()
            }) {
                Image(systemName: "chevron.right")
                    .font(.title)
                    .foregroundStyle(getCurrentGradient())
                    .frame(width: 52, height: 52)
                    .background(
                        Circle()
                            .fill(Color(.systemGray6))
                            .opacity(0.8)
                    )
            }
        }
        .frame(height: 70)
        .frame(maxWidth: .infinity, alignment: .center)
    }
    
    private func getCurrentGradient() -> LinearGradient {
        GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
    }
}

// MARK: - Interval Slider
struct IntervalSlider: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.horizontalSizeClass) var horizontalSizeClass
    @State private var sliderValue: Double = 0.0
    
    var body: some View {
        VStack(spacing: 1) {
            Text("\(getCurrentInterval(), specifier: "%.1f")s")
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundStyle(getCurrentGradient())
            
            GeometryReader { geo in
                let trackHeight: CGFloat = 12
                let width = geo.size.width
                ZStack(alignment: .leading) {
                    // 背景トラック
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color(.systemGray5))
                        .frame(height: trackHeight)
                    // フィル部分（テーマのグラデーション）
                    RoundedRectangle(cornerRadius: 6)
                        .fill(getCurrentGradient())
                        .frame(width: max(0, min(width, width * sliderValue)), height: trackHeight)
                    // つまみ（アクセント）
                    Circle()
                        .fill(Color.white)
                        .overlay(Circle().stroke(Color.secondary.opacity(0.3), lineWidth: 0.5))
                        .frame(width: 20, height: 20)
                        // バーの中心にノブを垂直センタリング
                        .offset(x: max(0, min(width - 20, width * sliderValue - 10)), y: 0)
                        .gesture(DragGesture(minimumDistance: 0)
                            .onChanged { value in
                                let x = max(0, min(width, value.location.x))
                                sliderValue = (x / width).clamped(to: 0...1)
                                let newInterval = getIntervalFromSliderValue(sliderValue)
                                appState.updateInterval(newInterval, isPortrait: !appState.isLandscape)
                            }
                            .onEnded { _ in
                                UISelectionFeedbackGenerator().selectionChanged()
                            }
                        )
                }
            }
            .frame(height: 24)
            .onAppear {
                sliderValue = getSliderValueFromInterval(getCurrentInterval())
            }
            .onChange(of: appState.isLandscape) { _, _ in
                // 向きが変更された時にスライダーの値を更新
                sliderValue = getSliderValueFromInterval(getCurrentInterval())
            }
        }
        .frame(height: 70)
    }
    
    private func getCurrentInterval() -> Double {
        // AppState.isLandscapeと同じ判定を使用
        appState.isLandscape ? appState.landscapeInterval : appState.portraitInterval
    }
    
    private func getMaxDuration() -> Double {
        // AppState.isLandscapeと同じ判定を使用
        appState.isLandscape ? 10.0 : 5.0
    }
    
    private func getSliderValueFromInterval(_ interval: Double) -> Double {
        let maxDuration = getMaxDuration()
        return ((maxDuration - interval) / (maxDuration - 0.5)).clamped(to: 0...1)
    }
    
    private func getIntervalFromSliderValue(_ value: Double) -> Double {
        let maxDuration = getMaxDuration()
        return (maxDuration - value * (maxDuration - 0.5)).clamped(to: 0.5...maxDuration)
    }
    
    private func getCurrentGradient() -> LinearGradient {
        GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
    }
    
    // Slider専用アクセント色は不要になったため削除
}

// MARK: - Progress Gauge
struct ProgressGauge: View {
    @EnvironmentObject var appState: AppState
    @State private var showResetConfirmation = false
    
    var body: some View {
        Button(action: {
            showResetConfirmation = true
        }) {
            VStack(spacing: 8) {
                Text("\(appState.viewedCount) / \(appState.totalWordsInLevel)")
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundStyle(getCurrentGradient())
                
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 6)
                            .fill(Color(.systemGray5))
                            .frame(height: 12)
                        
                        RoundedRectangle(cornerRadius: 6)
                            .fill(getCurrentGradient())
                            .frame(width: geometry.size.width * progress, height: 12)
                    }
                }
                .frame(height: 12)
            }
        }
        .buttonStyle(.plain)
        .alert("進捗のリセット", isPresented: $showResetConfirmation) {
            Button("いいえ", role: .cancel) { }
            Button("はい") {
                resetProgress()
            }
        } message: {
            Text("このレベルの学習進捗をリセットしますか？")
        }
    }
    
    private var progress: Double {
        guard appState.totalWordsInLevel > 0 else { return 0.0 }
        return Double(appState.viewedCount) / Double(appState.totalWordsInLevel)
    }
    
    private func getCurrentGradient() -> LinearGradient {
        GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
    }
    
    private func resetProgress() {
        if appState.currentLevel == .review || appState.currentLevel == .quo { return }
        
        let key = "viewedWords_\(appState.currentLevel.rawValue)"
        UserDefaults.standard.removeObject(forKey: key)
        appState.updateProgress()
    }
}

// MARK: - History Panel
struct HistoryPanel: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.horizontalSizeClass) var horizontalSizeClass
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        GeometryReader { geometry in
            let isLandscape = geometry.size.width > geometry.size.height
            let historyData = isLandscape ? appState.sentenceHistory : appState.history
            let historyTitle = isLandscape ? "例文履歴" : "学習履歴"
            let historyCount = isLandscape ? "個の例文" : "個の単語"
            
            VStack(spacing: 0) {
                // 美しいヘッダー
                ZStack {
                    // グラデーション背景
                    getCurrentGradient()
                        .frame(height: 80)
                    
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(historyTitle)
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            
                            Text("\(historyData.count)\(historyCount)")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.8))
                        }
                        .padding(.leading, 20)
                    
                    Spacer()
                    
                    Button(action: {
                        withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                            appState.toggleHistoryMode()
                        }
                    }) {
                        Image(systemName: "xmark")
                            .font(.title2)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .frame(width: 44, height: 44)
                            .background(
                                Circle()
                                    .fill(.white.opacity(0.2))
                                    .background(.ultraThinMaterial)
                            )
                    }
                    .padding(.trailing, 20)
                    .buttonStyle(.plain)
                }
            }
            
                // 履歴リスト
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(Array(historyData.enumerated()), id: \.element.id) { index, word in
                            HistoryItem(word: word, isLandscape: isLandscape, index: index)
                                .transition(.asymmetric(
                                    insertion: .scale(scale: 0.8).combined(with: .opacity).combined(with: .move(edge: .top)),
                                    removal: .scale(scale: 0.8).combined(with: .opacity)
                                ))
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 16)
                }
                .background(
                    LinearGradient(
                        colors: [
                            Color(.systemBackground),
                            colorScheme == .dark ? Color(.systemGray6).opacity(0.3) : Color(.systemGray6).opacity(0.1)
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .shadow(color: .black.opacity(0.1), radius: 20, x: 0, y: -5)
            .frame(maxHeight: horizontalSizeClass == .regular ? .infinity : UIScreen.main.bounds.height * 0.7)
            .transition(.asymmetric(
                insertion: .move(edge: .bottom).combined(with: .opacity),
                removal: .move(edge: .bottom).combined(with: .opacity)
            ))
        }
    }
    
    private func getCurrentGradient() -> LinearGradient {
        GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
    }
}

// MARK: - History Item
struct HistoryItem: View {
    let word: Word
    let isLandscape: Bool
    let index: Int
    @Environment(\.colorScheme) var colorScheme
    @State private var isPressed = false
    
    var body: some View {
        cardContent
            .padding(20)
            .background(cardBackground)
            .scaleEffect(isPressed ? 0.98 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: isPressed)
            .onTapGesture {
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
            }
            .onLongPressGesture(minimumDuration: 0) { pressing in
                isPressed = pressing
            } perform: {
                // 長押し時の処理（必要に応じて）
            }
    }
    
    private var cardContent: some View {
        HStack(spacing: 16) {
            indexCircle
            wordContent
            Spacer()
        }
    }
    
    private var indexCircle: some View {
        ZStack {
            Circle()
                .fill(indexGradient)
                .frame(width: 32, height: 32)
            
            Text("\(index + 1)")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.white)
        }
    }
    
    private var indexGradient: LinearGradient {
        LinearGradient(
            colors: [Color.blue.opacity(0.8), Color.purple.opacity(0.8)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
    
    private var wordContent: some View {
        VStack(alignment: .leading, spacing: 8) {
            if isLandscape {
                landscapeContent
            } else {
                portraitContent
            }
        }
    }
    
    private var landscapeContent: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(word.sentenceEnglish)
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundColor(.primary)
            
            Text(word.sentenceJapanese)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .lineLimit(2)
        }
    }
    
    private var portraitContent: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(word.english)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                Spacer()
                
                levelBadge
            }
            
            japaneseInfo
        }
    }
    
    private var levelBadge: some View {
        Text("Lv.\(word.level)")
            .font(.caption2)
            .fontWeight(.medium)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Capsule().fill(Color.blue.opacity(0.1)))
            .foregroundColor(.blue)
    }
    
    private var japaneseInfo: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 8) {
                Text(word.kanji)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                
                Text("•")
                    .foregroundColor(.secondary)
                
                Text(word.hiragana)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Text(word.romaji)
                .font(.caption)
                .foregroundColor(.secondary)
                .italic()
        }
    }
    
    private var cardBackground: some View {
        RoundedRectangle(cornerRadius: 16)
            .fill(backgroundColor)
            .shadow(
                color: shadowColor,
                radius: isPressed ? 2 : 8,
                x: 0,
                y: isPressed ? 1 : 4
            )
    }
    
    private var backgroundColor: Color {
        colorScheme == .dark 
        ? Color(.systemGray6).opacity(0.8)
        : Color.white
    }
    
    private var shadowColor: Color {
        colorScheme == .dark 
        ? Color.black.opacity(0.3) 
        : Color.black.opacity(0.08)
    }
}

// MARK: - Tutorial Overlay
struct TutorialOverlay: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        ZStack {
            Color.black.opacity(0.8)
                .ignoresSafeArea()
            
            VStack(spacing: 48) {
                TutorialInfoBox(
                    text: "左右にスワイプして\n「復習リスト」に追加",
                    icon: "arrow.left.and.right",
                    position: .top
                )
                
                TutorialInfoBox(
                    text: "タップで単語の\n「履歴」を表示",
                    position: .center
                )
                
                TutorialInfoBox(
                    text: "各種設定アイコン",
                    icon: "arrow.up",
                    position: .top
                )
                
                TutorialInfoBox(
                    text: "タップで速度と進捗を表示",
                    icon: "arrow.up",
                    position: .bottom
                )
                
                Spacer()
                
                Button("はじめる") {
                    appState.onTutorialFinished()
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .padding(.bottom, 60)
            }
        }
    }
}

// MARK: - Tutorial Info Box
struct TutorialInfoBox: View {
    let text: String
    let icon: String?
    let position: TutorialPosition
    
    init(text: String, icon: String? = nil, position: TutorialPosition) {
        self.text = text
        self.icon = icon
        self.position = position
    }
    
    var body: some View {
        VStack(spacing: 12) {
            if let icon = icon, position == .top {
                Image(systemName: icon)
                    .font(.system(size: 44))
                    .foregroundColor(.white)
            }
            
            Text(text)
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
                .lineLimit(nil)
            
            if let icon = icon, position == .bottom {
                Image(systemName: icon)
                    .font(.system(size: 44))
                    .foregroundColor(.white)
            }
        }
    }
}

enum TutorialPosition {
    case top, center, bottom
}


// MARK: - Icon Button
struct IconButton: View {
    let icon: String
    let isText: Bool
    let action: () -> Void
    @EnvironmentObject var appState: AppState
    @Environment(\.horizontalSizeClass) var horizontalSizeClass
    
    init(icon: String, isText: Bool = false, action: @escaping () -> Void) {
        self.icon = icon
        self.isText = isText
        self.action = action
    }
    
    var body: some View {
        Button(action: action) {
            if isText {
                Text(icon)
                    .font(.system(size: horizontalSizeClass == .compact ? 12 : 14, weight: .semibold))
                    .foregroundStyle(getCurrentGradient())
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                    .frame(width: horizontalSizeClass == .compact ? 48 : 52, height: horizontalSizeClass == .compact ? 48 : 52)
            } else {
                Image(systemName: icon)
                    .font(.system(size: horizontalSizeClass == .compact ? 22 : 24, weight: .semibold))
                    .foregroundStyle(getCurrentGradient())
                    .frame(width: horizontalSizeClass == .compact ? 48 : 52, height: horizontalSizeClass == .compact ? 48 : 52)
            }
        }
        .frame(width: horizontalSizeClass == .compact ? 48 : 52, height: horizontalSizeClass == .compact ? 48 : 52)
        .background(
            Circle()
                .fill(Color(.systemGray6))
                .opacity(0.8)
        )
        .buttonStyle(.plain)
    }
    
    private func getCurrentGradient() -> LinearGradient {
        return GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
    }
}

// MARK: - Extensions
extension Comparable {
    func clamped(to limits: ClosedRange<Self>) -> Self {
        min(max(self, limits.lowerBound), limits.upperBound)
    }
}

// MARK: - Speech Settings View
struct SpeechSettingsView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) var dismiss
    @Environment(\.horizontalSizeClass) var horizontalSizeClass
    
    var body: some View {
        NavigationView {
            Form {
                // 音声モードセクションは削除
                Section(header: Text("音声速度")) {
                    // 母国語（日本語）
                    VStack(alignment: .leading, spacing: 12) {
                        Text("母国語")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                        HStack {
                            Text("遅い").font(.caption).foregroundColor(.secondary)
                            Spacer()
                            Text("速い").font(.caption).foregroundColor(.secondary)
                        }
                        Slider(
                            value: Binding(
                                get: { Double(appState.japaneseSpeechRate) },
                                set: { appState.updateSpeechRate(japanese: Float($0)) }
                            ),
                            in: 0.1...0.8,
                            step: 0.05
                        )
                    }
                    .padding(.vertical, 4)
                    
                    // 学習言語（現在選択中の言語）
                    VStack(alignment: .leading, spacing: 12) {
                        Text("学習言語")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                        HStack {
                            Text("遅い").font(.caption).foregroundColor(.secondary)
                            Spacer()
                            Text("速い").font(.caption).foregroundColor(.secondary)
                        }
                        Slider(
                            value: Binding(
                                get: { Double(currentLearningRate()) },
                                set: { setCurrentLearningRate(Float($0)) }
                            ),
                            in: 0.1...0.8,
                            step: 0.05
                        )
                    }
                    .padding(.vertical, 4)
                }
                
                // 表示順序（A→あ を統合）
                Section(header: Text("表示順序"), footer: Text("母国語→学習言語 か 学習言語→母国語 を選択")) {
                    Picker("表示順序", selection: Binding(
                        get: { appState.showEnglishFirst ? 0 : 1 },
                        set: { newValue in
                            // 0: 母国語→学習言語（英語が先） / 1: 学習言語→母国語
                            let englishFirst = (newValue == 0)
                            if englishFirst != appState.showEnglishFirst {
                                appState.setLanguageOrder(showSelectedFirst: englishFirst)
                            }
                        }
                    )) {
                        Text("母国語→学習言語").tag(0)
                        Text("学習言語→母国語").tag(1)
                    }
                    .pickerStyle(.segmented)
                }

                // 発音記号（漢 アイコンを統合）
                Section(header: Text("発音記号")) {
                    Toggle(isOn: Binding(
                        get: {
                            // あり: 表示モードが「漢あ」(index 1) または「ふりがな系」(index 2) の場合
                            if appState.currentLevel == .business {
                                return appState.displayModeIndex % 2 == 1
                            } else {
                                return appState.displayModeIndex % 3 != 0
                            }
                        },
                        set: { enabled in
                            appState.setPhoneticNotationEnabled(enabled)
                        }
                    )) {
                        Text("発音記号表示")
                    }
                }
                
            }
            .navigationTitle("音声設定")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("完了") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func getCurrentGradient() -> LinearGradient {
        return GradientPreset.gradients[appState.gradientIndex % GradientPreset.gradients.count]
    }
    
    // 学習言語の現在の速度レート
    private func currentLearningRate() -> Float {
        switch appState.currentLanguage {
        case .english: return appState.englishSpeechRate
        case .japanese: return appState.japaneseSpeechRate
        case .french: return appState.frenchSpeechRate
        case .korean: return appState.koreanSpeechRate
        case .chinese: return appState.chineseSpeechRate
        }
    }
    
    // 学習言語の速度レートを更新
    private func setCurrentLearningRate(_ value: Float) {
        switch appState.currentLanguage {
        case .english:
            appState.updateSpeechRate(english: value)
        case .japanese:
            appState.updateSpeechRate(japanese: value)
        case .french:
            appState.updateSpeechRate(french: value)
        case .korean:
            appState.updateSpeechRate(korean: value)
        case .chinese:
            appState.updateSpeechRate(chinese: value)
        }
    }
}



// MARK: - Language Selection Icon
struct LanguageSelectionIcon: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.horizontalSizeClass) var horizontalSizeClass
    @State private var showLanguagePicker = false
    
    var body: some View {
        Button(action: {
            showLanguagePicker = true
        }) {
            ZStack {
                Circle()
                    .fill(Color(.systemGray6))
                    .opacity(0.8)
                Text(appState.currentLanguage.flag)
                    .font(.system(size: horizontalSizeClass == .compact ? 22 : 24, weight: .regular))
                    .foregroundColor(.primary)
            }
            .frame(width: horizontalSizeClass == .compact ? 40 : 44, height: horizontalSizeClass == .compact ? 40 : 44)
        }
        .buttonStyle(.plain)
        .sheet(isPresented: $showLanguagePicker) {
            LanguagePickerSheet()
        }
    }
}

// MARK: - Language Picker Sheet
struct LanguagePickerSheet: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        let _ = print("🔍 LanguagePickerSheet: availableLanguages = \(Language.availableLanguages.map { $0.displayName })")
        NavigationView {
            List {
                ForEach(Language.availableLanguages, id: \.self) { language in
                    Button(action: {
                        appState.changeLanguage(language)
                        dismiss()
                    }) {
                        HStack(spacing: 16) {
                            Text(language.flag)
                                .font(.title)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(language.displayName)
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                Text(language.nativeName)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                            
                            if appState.currentLanguage == language {
                                Image(systemName: "checkmark")
                                    .foregroundColor(.blue)
                                    .fontWeight(.semibold)
                            }
                        }
                        .padding(.vertical, 8)
                    }
                    .buttonStyle(.plain)
                }
            }
            .navigationTitle("言語を選択")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("完了") {
                        dismiss()
                    }
                }
            }
        }
    }
}
