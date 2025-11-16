# SwitchBot API認証情報の設定方法

## ステップ1: SwitchBotアプリからトークンとシークレットを取得

1. **SwitchBotアプリを開く**
   - スマートフォンのSwitchBotアプリを起動します
   - アプリが最新バージョン（V6.14以降）であることを確認してください

2. **開発者向けオプションを表示**
   - アプリ内で **プロフィール** をタップ
   - **環境設定** をタップ
   - **アプリバージョン** を **10回連続でタップ**
   - 「開発者向けオプション」が表示されます

3. **トークンを取得**
   - 「開発者向けオプション」内で **「トークンを取得」** を選択
   - 以下の情報が表示されます：
     - **トークン（Token）**: 長い文字列
     - **シークレット（Secret）**: 長い文字列
   - これらをコピーして保存してください

## ステップ2: .envファイルを作成

プロジェクトのルートディレクトリに `.env` ファイルを作成し、以下の形式で認証情報を設定してください：

```
SWITCHBOT_TOKEN=ここに取得したトークンを貼り付け
SWITCHBOT_SECRET=ここに取得したシークレットを貼り付け
```

### 例：

```
SWITCHBOT_TOKEN=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
SWITCHBOT_SECRET=xyz987wvu654tsr321qpo098nml765kji432hgf109edc876ba
```

## ステップ3: サーバーを再起動

`.env`ファイルを保存したら、サーバーを再起動してください：

```bash
# 現在のサーバーを停止（Ctrl+C）
# その後、再度起動
npm start
```

## トラブルシューティング

### エラー: "The 'key' argument must be of type string..."
- `.env`ファイルが正しく作成されているか確認
- トークンとシークレットに余分なスペースや改行が含まれていないか確認
- サーバーを再起動したか確認

### デバイスが見つからない
- SwitchBot Hubが正しく接続されているか確認
- SwitchBotアプリでデバイスが表示されるか確認
- インターネット接続を確認

## 参考リンク

- [SwitchBot公式GitHub](https://github.com/OpenWonderLabs/SwitchBotAPI)
- [SwitchBot APIドキュメント](https://github.com/OpenWonderLabs/SwitchBotAPI#readme)

