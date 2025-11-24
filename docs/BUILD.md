# .exeファイルのビルド方法

このアプリをWindowsの実行可能ファイル（.exe）としてビルドする方法です。

## 必要な準備

1. Node.jsがインストールされていること
2. プロジェクトの依存関係がインストールされていること

```bash
npm install
```

## ビルド手順

### 1. .exeファイルのビルド

```bash
npm run build:nexe
```

これで `dist` フォルダに `switchbot-app-nexe.exe` が生成されます。

**注意**: 初回実行時は、Node.jsのバイナリ（約30-50MB）をダウンロードするため、数分かかります。完了までお待ちください。

## 使用方法

### .exeファイルの実行

1. `dist` フォルダ内の `switchbot-app-nexe.exe` をダブルクリックして起動
2. または、コマンドプロンプトから実行：
   ```cmd
   dist\switchbot-app-nexe.exe
   ```

### 初回設定

**重要**: `.exe`ファイルを実行する前に、`.exe`ファイルと同じディレクトリに`.env`ファイルを配置してください。

1. `dist`フォルダに`.env`ファイルを作成（またはコピー）
2. `.env`ファイルに以下の内容を設定：
   ```
   SWITCHBOT_TOKEN=your_token_here
   SWITCHBOT_SECRET=your_secret_here
   DEVICE_ID=your_device_id_here
   PORT=3000
   TIMEOUT_MS=10000
   ```
3. （Windowsのみ、オプション）`minimize_browser_window.ps1`を`dist`フォルダにコピー（ブラウザ最小化機能を使用する場合）

詳細は [SETUP.md](./SETUP.md) を参照してください。

### 実行

`.exe`ファイルをダブルクリックすると、サーバーが起動します。
ブラウザで `http://localhost:3000` にアクセスして使用できます。

## 配布方法

他のPCで使用する場合：

1. `dist`フォルダ全体をコピー
2. 使用するPCに配置
3. `.env`ファイルを設定（上記参照）
4. （Windowsのみ、オプション）`minimize_browser_window.ps1`を`dist`フォルダにコピー
5. `switchbot-app-nexe.exe`を実行

**注意**: Node.jsをインストールする必要はありません。.exeファイルにNode.jsが含まれています。

**注意**: ブラウザ最小化機能を使用する場合、`minimize_browser_window.ps1`を`dist`フォルダに配置してください。

## トラブルシューティング

### .exeファイルが起動しない

- Windows Defenderやウイルス対策ソフトがブロックしていないか確認
- 管理者権限で実行してみる
- エラーメッセージが表示される場合は、コンソールを確認（キー入力まで待機）

### .envファイルが読み込まれない

**エラー:**
```
❌ エラー: .envファイルにSWITCHBOT_TOKENとSWITCHBOT_SECRETが設定されていません
```

**解決方法:**
- `.exe`ファイルと同じディレクトリ（`dist`フォルダ）に`.env`ファイルを配置
- `.env`ファイルの内容を確認
- `.env`ファイルの文字コードがUTF-8であることを確認

### ポートが使用中

**エラー:**
```
❌ エラー: ポート3000は既に使用されています。
```

**解決方法:**
- 既に起動しているサーバーを停止してください
- タスクマネージャーで`switchbot-app-nexe.exe`を終了
- `.env`ファイルで`PORT=3001`など別のポートを指定

### デバッグモード

エラーの詳細を確認する場合、環境変数`DEBUG=1`を設定して実行：

```bash
# Windows (コマンドプロンプト)
set DEBUG=1
dist\switchbot-app-nexe.exe

# Windows (PowerShell)
$env:DEBUG=1
.\dist\switchbot-app-nexe.exe
```

これで、使用されているパスなどの情報が表示されます。

### コンソールがすぐに閉じる

exeをダブルクリックで起動した場合、エラーが発生するとコンソールが閉じてしまいます。
エラーメッセージが表示された場合は、キー入力まで待機してメッセージを確認してください。

## 再ビルド

修正を反映するには、再度ビルドしてください：

```bash
npm run build:nexe
```

## 確認事項

1. ✅ `.env`ファイルが`.exe`と同じディレクトリ（`dist`フォルダ）にあるか
2. ✅ `.env`ファイルに正しい認証情報が設定されているか
3. ✅ ポート3000が使用されていないか
4. ✅ 静的ファイル（`public`フォルダ）は`.exe`に埋め込まれているか
5. ✅ （Windowsのみ、オプション）`minimize_browser_window.ps1`が`dist`フォルダにあるか（ブラウザ最小化機能を使用する場合）

## その他の起動方法

起動方法の詳細は [STARTUP.md](./STARTUP.md) を参照してください。

主な起動方法：
- **バッチファイル**: `start.bat`をダブルクリック（推奨・簡単）
- **npmコマンド**: `npm start`（開発用）
- **PowerShell**: `.\start.ps1`（PowerShell版）
- **直接実行**: `node server.js`（開発・デバッグ用）
