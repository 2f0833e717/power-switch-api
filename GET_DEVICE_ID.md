# デバイスIDの取得方法

デバイスIDを取得する方法は以下の3つがあります。

## 方法1: WebアプリのUIから取得（推奨）

1. ブラウザで `http://localhost:3000` を開く
2. ページが読み込まれると、自動的にデバイスリストが取得されます
3. デバイス選択ドロップダウンにデバイスが表示されます
4. ブラウザの開発者ツール（F12）を開き、コンソールで以下を実行：
   ```javascript
   document.getElementById('deviceSelect').value
   ```
   または、選択したデバイスのオプション要素を確認：
   ```javascript
   document.getElementById('deviceSelect').selectedOptions[0].value
   ```

## 方法2: APIエンドポイントから直接取得

サーバーが起動している状態で、以下のコマンドを実行：

```bash
curl http://localhost:3000/api/devices
```

または、PowerShellの場合：

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/devices | ConvertTo-Json -Depth 10
```

レスポンスの `body.deviceList` 配列内の各デバイスオブジェクトに `deviceId` が含まれています。

## 方法3: .envファイルに設定（オプション）

デバイスIDを取得したら、`.env`ファイルに設定することで、毎回デバイスを選択する必要がなくなります：

```
DEVICE_ID=取得したデバイスID
```

**注意**: `DEVICE_ID`はオプションです。設定しなくても、Webアプリからデバイスを選択して制御できます。

