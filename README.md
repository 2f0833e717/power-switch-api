# SwitchBot 電源制御 Webアプリ

SwitchBot APIを使用して、家の電源ボタンをOn/OffにするWebアプリケーションです。

## 機能

- 🔌 デバイスリストの表示
- ⚡ 電源のOn/Off制御
- 📱 レスポンシブデザイン
- 🎨 モダンなUI

## 必要なもの

- Node.js (v14以上)
- SwitchBot Hub
- SwitchBot APIのトークンとシークレット

## セットアップ

### 1. SwitchBot API認証情報の取得

詳細は [SETUP.md](docs/SETUP.md) を参照してください。

### 2. プロジェクトのセットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数ファイルの作成
# .envファイルを作成して、取得したトークンとシークレットを設定
# SWITCHBOT_TOKEN=your_token_here
# SWITCHBOT_SECRET=your_secret_here
```

詳細は [SETUP.md](docs/SETUP.md) を参照してください。

### 3. サーバーの起動

起動方法の詳細は [STARTUP.md](docs/STARTUP.md) を参照してください。

**簡単に起動する場合:**
- `start.bat` をダブルクリック（推奨）

**その他の起動方法:**
- `npm start` - 開発用
- `.exe`ファイル - Node.js不要（配布用）

ブラウザで `http://localhost:3000` にアクセスしてください。

## 使用方法

1. ブラウザで `http://localhost:3000` を開く
2. デバイスリストから制御したいデバイスを選択
3. 「電源ON」または「電源OFF」ボタンをクリック

## 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `SWITCHBOT_TOKEN` | SwitchBot APIトークン | はい |
| `SWITCHBOT_SECRET` | SwitchBot APIシークレット | はい |
| `DEVICE_ID` | デバイスID（オプション） | いいえ |
| `PORT` | サーバーポート（デフォルト: 3000） | いいえ |

## API エンドポイント

### GET /api/devices
デバイスリストを取得します。

### POST /api/turn-off
電源をOffにします。

**リクエストボディ:**
```json
{
  "deviceId": "デバイスID（オプション）"
}
```

### POST /api/turn-on
電源をOnにします。

**リクエストボディ:**
```json
{
  "deviceId": "デバイスID（オプション）"
}
```

## ドキュメント

- [STARTUP.md](docs/STARTUP.md) - 起動方法の詳細
- [SETUP.md](docs/SETUP.md) - SwitchBot API認証情報の設定方法
- [BUILD.md](docs/BUILD.md) - .exeファイルのビルド方法
- [GET_DEVICE_ID.md](docs/GET_DEVICE_ID.md) - デバイスIDの取得方法

## トラブルシューティング

### デバイスが見つからない
- SwitchBot Hubが正しく接続されているか確認してください
- SwitchBotアプリでデバイスが表示されるか確認してください
- デバイスIDの取得方法は [GET_DEVICE_ID.md](docs/GET_DEVICE_ID.md) を参照してください

### APIエラーが発生する
- トークンとシークレットが正しく設定されているか確認してください
- SwitchBot Hubがインターネットに接続されているか確認してください
- 認証情報の設定方法は [SETUP.md](docs/SETUP.md) を参照してください

### .exeファイルのトラブル
- 詳細は [BUILD.md](docs/BUILD.md) のトラブルシューティングセクションを参照してください

## ライセンス

MIT

