# AI Guide Camera

スマートフォンのカメラやスマートグラスなどを通じて、周囲の風景をAIと一緒に見ながら探索できる「AIコンパニオン」のWebアプリケーションです。

GitHub リポジトリ: [simeis512/ai_guide_camera](https://github.com/simeis512/ai_guide_camera)

### 開発環境のセットアップ

```bash
cd app
npm install
npm run dev
```

### Vercel へのデプロイ方法

このプロジェクトはVercelへ簡単にデプロイすることができます。

1. [Vercel](https://vercel.com/) のダッシュボードから「Add New...」>「Project」を選択します。
2. 対象のGitリポジトリ（`ai_guide_camera`）をインポートします。
3. プロジェクトの設定画面（Configure Project）で、以下の通りに設定します：
   - **Framework Preset**: Vite
   - **Root Directory**: `app` （※非常に重要です。必ず `app` ディレクトリを指定してください）
   - **Build Command**: （Viteのデフォルト `npm run build` が自動で設定されます）
   - **Output Directory**: `dist` （自動で設定されます）
4. 「Deploy」をクリックしてデプロイを完了させます。

### 主な機能
- OpenAI (GPT-4o等)、Ollama (ローカルLLM)、Gemini 等のマルチモーダル（視覚）モデルに対応
- テキスト読み上げ（TTS）連携機能
- 自動で継続的に風景を解析してガイドを行う「自動ループ機能」
- 推論プロセス（思考モード）の有効・無効化の切り替え
- ユーザーからのテキストによる介入・指示
