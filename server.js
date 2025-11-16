// pkg/nexeでパッケージ化された場合の.envファイルのパスを設定
const path = require('path');
const fs = require('fs');

// pkg/nexeでパッケージ化されている場合の検出
const isPkg = typeof process.pkg !== 'undefined';
const isNexe = process.nexe !== undefined || process.argv[0].endsWith('.exe');
const isPackaged = isPkg || isNexe;

// .envファイルのパスを設定（複数の場所をチェック）
let envPath;
let envLoaded = false;

if (isPackaged) {
  // パッケージ化されている場合、複数の場所をチェック
  const execDir = path.dirname(process.execPath);
  const possiblePaths = [
    path.join(execDir, '.env'),           // 実行ファイルと同じディレクトリ
    path.join(execDir, '..', '.env'),     // 親ディレクトリ（プロジェクトルート）
    path.join(execDir, '..', '..', '.env') // さらに上のディレクトリ
  ];
  
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      envPath = possiblePath;
      require('dotenv').config({ path: possiblePath });
      envLoaded = true;
      break;
    }
  }
  
  // 見つからない場合は、デフォルトの場所を試す
  if (!envLoaded) {
    envPath = path.join(execDir, '.env');
    require('dotenv').config();
  }
} else {
  // 通常のNode.js実行の場合
  envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    envLoaded = true;
  } else {
    require('dotenv').config();
  }
}

// Windowsで既存のプロセスを停止する関数
function killProcessOnPort(port) {
  if (process.platform !== 'win32') return;
  
  const { execSync } = require('child_process');
  try {
    // ポートを使用しているプロセスのPIDを取得
    const result = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf-8' });
    const lines = result.trim().split('\n');
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      
      if (pid && pid !== '0') {
        try {
          // 自分自身のプロセスIDでない場合のみ停止
          if (parseInt(pid) !== process.pid) {
            console.log(`ポート${port}を使用しているプロセスを停止します (PID: ${pid})...`);
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          }
        } catch (err) {
          // プロセスが既に存在しない場合は無視
        }
      }
    }
    
    // 少し待機（同期的に）
    if (lines.length > 0) {
      const start = Date.now();
      while (Date.now() - start < 1000) {
        // 1秒待機
      }
    }
  } catch (err) {
    // エラーは無視（プロセスが見つからない場合など）
  }
}

// Windowsでexeをダブルクリックした場合、エラー時にコンソールを保持する関数
function keepConsoleOpen() {
  if (process.platform === 'win32' && isPackaged) {
    // パッケージ化されたexeの場合、コンソールを保持
    console.log('\nエラーが発生しました。このウィンドウを閉じるには、何かキーを押してください...');
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('', () => {
      rl.close();
      process.exit(1);
    });
    
    // プロセスを終了させないように、イベントループを維持
    // ただし、メイン処理は停止する必要がある
  } else {
    process.exit(1);
  }
}

const express = require('express');
const SwitchBotAPI = require('./switchbot');

const app = express();
const PORT = process.env.PORT || 3000;

// 起動前に既存のプロセスを停止（Windowsのみ）
if (process.platform === 'win32') {
  killProcessOnPort(PORT);
}

// ミドルウェア
app.use(express.json());

// 静的ファイルのパスを設定（pkg/nexe対応）
let publicPath;
if (isPackaged) {
  // nexeの場合、静的ファイルは実行ファイルに埋め込まれている可能性がある
  // まず実行ファイルのディレクトリを確認
  const execDir = path.dirname(process.execPath);
  const publicDir = path.join(execDir, 'public');
  
  if (fs.existsSync(publicDir)) {
    // publicフォルダが存在する場合（pkgの場合など）
    publicPath = publicDir;
  } else {
    // nexeで埋め込まれた場合、__dirnameを使用（nexeは実行時に展開する）
    publicPath = path.join(__dirname, 'public');
    // それでも存在しない場合は、実行ファイルのディレクトリを使用
    if (!fs.existsSync(publicPath)) {
      publicPath = execDir;
    }
  }
} else {
  // 通常のNode.js実行の場合
  publicPath = path.join(__dirname, 'public');
}

app.use(express.static(publicPath));

// デバッグ情報（開発時のみ）
if (process.env.DEBUG) {
  console.log('パッケージ化状態:', { isPkg, isNexe, isPackaged });
  console.log('実行ファイルパス:', process.execPath);
  console.log('実行ファイルディレクトリ:', path.dirname(process.execPath));
  console.log('__dirname:', __dirname);
  console.log('.envファイルパス:', envPath);
  console.log('静的ファイルパス:', publicPath);
  console.log('静的ファイル存在確認:', fs.existsSync(publicPath));
}

// 環境変数の検証
let hasValidEnv = true;
if (!process.env.SWITCHBOT_TOKEN || !process.env.SWITCHBOT_SECRET) {
  console.error('❌ エラー: .envファイルにSWITCHBOT_TOKENとSWITCHBOT_SECRETが設定されていません');
  console.log('SETUP.mdを参照して認証情報を設定してください。');
  console.log('\n.envファイルの場所:', envPath);
  if (isPackaged) {
    console.log('\n注意: exeファイルをダブルクリックで起動する場合、');
    console.log('.envファイルをexeファイルと同じディレクトリ（distフォルダ）に配置してください。');
  }
  hasValidEnv = false;
  keepConsoleOpen();
}

// 環境変数が有効な場合のみサーバーを起動
if (hasValidEnv) {
  // SwitchBot APIインスタンスの作成
  const switchbot = new SwitchBotAPI(
    process.env.SWITCHBOT_TOKEN,
    process.env.SWITCHBOT_SECRET
  );

  // デバイスID（環境変数から取得、または最初のデバイスを使用）
  const DEVICE_ID = process.env.DEVICE_ID;

  if (DEVICE_ID) {
    console.log(`✅ デフォルトデバイスID: ${DEVICE_ID}`);
  }

  // ルート: ホームページ
  app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });

  // API: デバイスリストを取得
  app.get('/api/devices', async (req, res) => {
    try {
      const devices = await switchbot.getDevices();
      res.json(devices);
    } catch (error) {
      console.error('デバイスリスト取得エラー:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: デフォルトデバイスIDを取得
  app.get('/api/default-device', (req, res) => {
    res.json({ deviceId: DEVICE_ID || null });
  });

  // API: 電源をOffにする
  app.post('/api/turn-off', async (req, res) => {
    try {
      const deviceId = req.body.deviceId || DEVICE_ID;
      
      if (!deviceId) {
        return res.status(400).json({ 
          error: 'デバイスIDが指定されていません。環境変数DEVICE_IDを設定するか、リクエストボディにdeviceIdを含めてください。' 
        });
      }

      const result = await switchbot.turnOff(deviceId);
      res.json({ 
        success: true, 
        message: '電源をOffにしました',
        result 
      });
    } catch (error) {
      console.error('電源Offエラー:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });

  // API: 電源をOnにする（オプション）
  app.post('/api/turn-on', async (req, res) => {
    try {
      const deviceId = req.body.deviceId || DEVICE_ID;
      
      if (!deviceId) {
        return res.status(400).json({ 
          error: 'デバイスIDが指定されていません。環境変数DEVICE_IDを設定するか、リクエストボディにdeviceIdを含めてください。' 
        });
      }

      const result = await switchbot.turnOn(deviceId);
      res.json({ 
        success: true, 
        message: '電源をOnにしました',
        result 
      });
    } catch (error) {
      console.error('電源Onエラー:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });

  // API: 明るさを設定する
  app.post('/api/set-brightness', async (req, res) => {
    try {
      const deviceId = req.body.deviceId || DEVICE_ID;
      const brightness = parseInt(req.body.brightness);
      
      if (!deviceId) {
        return res.status(400).json({ 
          error: 'デバイスIDが指定されていません。環境変数DEVICE_IDを設定するか、リクエストボディにdeviceIdを含めてください。' 
        });
      }

      if (!brightness || isNaN(brightness)) {
        return res.status(400).json({ 
          error: '明るさの値が正しく指定されていません。1から100の間の数値を指定してください。' 
        });
      }

      const result = await switchbot.setBrightness(deviceId, brightness);
      res.json({ 
        success: true, 
        message: `明るさを${brightness}%に設定しました`,
        result 
      });
    } catch (error) {
      console.error('明るさ設定エラー:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });

  // サーバー起動
  const server = app.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
    console.log('SwitchBot APIを使用して電源を制御できます');
  });

  // エラーハンドリング
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n❌ エラー: ポート${PORT}は既に使用されています。`);
      
      // Windowsの場合、再度プロセス停止を試みる
      if (process.platform === 'win32') {
        console.log('既存のプロセスを停止しようとしています...');
        killProcessOnPort(PORT);
        
        // 少し待ってから再試行
        setTimeout(() => {
          console.log('再起動を試みます...');
          const newServer = app.listen(PORT, () => {
            console.log(`サーバーが起動しました: http://localhost:${PORT}`);
            console.log('SwitchBot APIを使用して電源を制御できます');
          });
          
          newServer.on('error', (retryError) => {
            if (retryError.code === 'EADDRINUSE') {
              console.error(`\n❌ ポート${PORT}の解放に失敗しました。`);
              console.log('以下のいずれかを試してください:');
              console.log('1. 手動で既存のサーバーを停止してください');
              console.log('2. .envファイルでPORTを変更してください（例: PORT=3001）');
              console.log('3. タスクマネージャーでnode.exeプロセスを終了してください\n');
              keepConsoleOpen();
            }
          });
        }, 2000);
      } else {
        console.log('以下のいずれかを試してください:');
        console.log('1. 既に起動しているサーバーを停止してください');
        console.log('2. .envファイルでPORTを変更してください（例: PORT=3001）\n');
        keepConsoleOpen();
      }
    } else {
      console.error('サーバー起動エラー:', error);
      keepConsoleOpen();
    }
  });

  // 未処理のエラーをキャッチ
  process.on('uncaughtException', (error) => {
    console.error('\n❌ 予期しないエラーが発生しました:');
    console.error(error);
    keepConsoleOpen();
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('\n❌ 未処理のPromise拒否が発生しました:');
    console.error(reason);
    keepConsoleOpen();
  });
}

