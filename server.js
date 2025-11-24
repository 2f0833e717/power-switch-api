// pkg/nexeでパッケージ化された場合の.envファイルのパスを設定
const path = require('path');
const fs = require('fs');

// pkg/nexeでパッケージ化されている場合の検出
const isPkg = typeof process.pkg !== 'undefined';
const isNexe = process.nexe !== undefined || process.argv[0].endsWith('.exe');
const isPackaged = isPkg || isNexe;

// ログディレクトリのパス設定
let logDir;
if (isPackaged) {
  const execDir = path.dirname(process.execPath);
  logDir = path.join(execDir, 'logs', 'log');
} else {
  logDir = path.join(__dirname, 'logs', 'log');
}

// ログディレクトリが存在しない場合は作成
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
    console.log(`ログディレクトリを作成しました: ${logDir}`);
  } catch (err) {
    console.error(`ログディレクトリの作成に失敗しました: ${logDir}`, err.message);
  }
} else {
  console.log(`ログディレクトリ: ${logDir}`);
}

// ログファイル名（日付ベース）
function getLogFileName() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(logDir, `${dateStr}.log`);
}

// ログをファイルに書き込む関数
function writeLog(level, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  const logFile = getLogFileName();
  
  try {
    // ログディレクトリが存在することを確認
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // ログファイルに書き込み
    fs.appendFileSync(logFile, logMessage, 'utf8');
  } catch (err) {
    // ログファイルへの書き込みエラーをコンソールに出力（詳細情報付き）
    console.error(`ログファイルへの書き込みエラー (${logFile}):`, err.message);
    console.error(`エラー詳細:`, err);
    console.error(`ログディレクトリの存在確認:`, fs.existsSync(logDir));
    console.error(`ログディレクトリの書き込み権限:`, fs.accessSync ? '確認中...' : '確認不可');
  }
}

// ロガー関数（コンソールとファイルの両方に出力）
const logger = {
  log: (message) => {
    console.log(message);
    try {
      writeLog('INFO', message);
    } catch (err) {
      console.error('ログ書き込み中にエラーが発生しました:', err.message);
    }
  },
  error: (message) => {
    console.error(message);
    try {
      writeLog('ERROR', message);
    } catch (err) {
      console.error('ログ書き込み中にエラーが発生しました:', err.message);
    }
  },
  warn: (message) => {
    console.warn(message);
    try {
      writeLog('WARN', message);
    } catch (err) {
      console.error('ログ書き込み中にエラーが発生しました:', err.message);
    }
  }
};

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
            logger.log(`ポート${port}を使用しているプロセスを停止します (PID: ${pid})...`);
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
    logger.log('\nエラーが発生しました。このウィンドウを閉じるには、何かキーを押してください...');
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
const { exec } = require('child_process');

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
  logger.log('パッケージ化状態: ' + JSON.stringify({ isPkg, isNexe, isPackaged }));
  logger.log('実行ファイルパス: ' + process.execPath);
  logger.log('実行ファイルディレクトリ: ' + path.dirname(process.execPath));
  logger.log('__dirname: ' + __dirname);
  logger.log('.envファイルパス: ' + envPath);
  logger.log('静的ファイルパス: ' + publicPath);
  logger.log('静的ファイル存在確認: ' + fs.existsSync(publicPath));
}

// 環境変数の検証
let hasValidEnv = true;
if (!process.env.SWITCHBOT_TOKEN || !process.env.SWITCHBOT_SECRET) {
  logger.error('❌ エラー: .envファイルにSWITCHBOT_TOKENとSWITCHBOT_SECRETが設定されていません');
  logger.log('SETUP.mdを参照して認証情報を設定してください。');
  logger.log('\n.envファイルの場所: ' + envPath);
  if (isPackaged) {
    logger.log('\n注意: exeファイルをダブルクリックで起動する場合、');
    logger.log('.envファイルをexeファイルと同じディレクトリ（distフォルダ）に配置してください。');
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
    logger.log(`✅ デフォルトデバイスID: ${DEVICE_ID}`);
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
      logger.error('デバイスリスト取得エラー: ' + error.message);
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
      logger.error('電源Offエラー: ' + error.message);
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
      logger.error('電源Onエラー: ' + error.message);
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
      logger.error('明るさ設定エラー: ' + error.message);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });

  // ブラウザプロセスIDを保持する変数（Windows専用）
  let browserProcessId = null;

  // ブラウザを自動で開く関数（プラットフォーム固有）
  function openBrowser() {
    const url = `http://localhost:${PORT}`;
    let command;
    
    switch (process.platform) {
      case 'win32':
        command = `start ${url}`;
        break;
      case 'darwin':
        command = `open ${url}`;
        break;
      case 'linux':
        command = `xdg-open ${url}`;
        break;
      default:
        logger.log(`ブラウザを自動で開けませんでした: サポートされていないプラットフォーム`);
        logger.log(`手動でブラウザを開いてください: ${url}`);
        return;
    }
    
    if (process.platform === 'win32') {
      // Windowsの場合、startコマンドで開いたプロセスのIDを取得
      const childProcess = exec(command, (error) => {
        if (error) {
          logger.log(`ブラウザを自動で開けませんでした: ${error.message}`);
          logger.log(`手動でブラウザを開いてください: ${url}`);
        }
      });
      
      // ブラウザが開いた後にプロセスIDを取得して保持
      setTimeout(() => {
        captureBrowserProcessId();
      }, 2000); // ブラウザが開くまで少し待つ
    } else {
      exec(command, (error) => {
        if (error) {
          logger.log(`ブラウザを自動で開けませんでした: ${error.message}`);
          logger.log(`手動でブラウザを開いてください: ${url}`);
        }
      });
    }
  }

  // ブラウザプロセスIDを取得して保持する関数（Windows専用）
  function captureBrowserProcessId() {
    if (process.platform !== 'win32') {
      return;
    }

    const tempScriptPath = path.join(__dirname, 'temp_capture_browser.ps1');
    const powershellScript = `$processes = Get-Process | Where-Object { $_.ProcessName -match "chrome|msedge|firefox|opera|brave" } | Sort-Object StartTime -Descending
if ($processes.Count -gt 0) {
  $newestProcess = $processes[0]
  Write-Output $newestProcess.Id
}`;

    try {
      fs.writeFileSync(tempScriptPath, powershellScript, 'utf8');
      
      exec(`powershell -ExecutionPolicy Bypass -File "${tempScriptPath}"`, (error, stdout, stderr) => {
        try {
          if (fs.existsSync(tempScriptPath)) {
            fs.unlinkSync(tempScriptPath);
          }
        } catch (err) {
          // 削除エラーは無視
        }
        
        if (!error && stdout) {
          const pid = parseInt(stdout.trim(), 10);
          if (!isNaN(pid) && pid > 0) {
            browserProcessId = pid;
            logger.log(`ブラウザプロセスIDを取得しました: ${pid}`);
          } else {
            logger.log('ブラウザプロセスIDの取得に失敗しました');
          }
        } else {
          logger.log('ブラウザプロセスIDの取得に失敗しました: ' + (error ? error.message : '不明なエラー'));
        }
      });
    } catch (err) {
      logger.log('ブラウザプロセスIDの取得中にエラーが発生しました: ' + err.message);
    }
  }

  // ブラウザウィンドウを最小化する関数（Windows専用）
  function minimizeBrowserWindow() {
    if (process.platform !== 'win32') {
      return; // Windows以外では何もしない
    }

    logger.log('ブラウザウィンドウを最小化しようとしています...');
    
    // minimize_browser_window.ps1を外部呼び出し
    // まず、minimize_browser_window.ps1のパスを取得
    let scriptPath;
    if (isPackaged) {
      // パッケージ化されている場合、実行ファイルと同じディレクトリを確認
      const execDir = path.dirname(process.execPath);
      scriptPath = path.join(execDir, 'minimize_browser_window.ps1');
      
      // 存在しない場合は、プロジェクトルートを確認
      if (!fs.existsSync(scriptPath)) {
        scriptPath = path.join(__dirname, 'minimize_browser_window.ps1');
      }
    } else {
      // 通常のNode.js実行の場合
      scriptPath = path.join(__dirname, 'minimize_browser_window.ps1');
    }
    
    // minimize_browser_window.ps1が存在しない場合は、内容を読み込んで一時ファイルとして作成
    if (!fs.existsSync(scriptPath)) {
      logger.log('minimize_browser_window.ps1が見つかりません。一時ファイルを作成します...');
      const tempScriptPath = path.join(__dirname, 'temp_minimize_browser.ps1');
      const testMinimizeContent = `Add-Type @"
using System;
using System.Runtime.InteropServices;

public class WinAPI {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@

# 現在アクティブなウィンドウのハンドル取得
$hwnd = [WinAPI]::GetForegroundWindow()

# 6 = 最小化
$result = [WinAPI]::ShowWindow($hwnd, 6)

if ($result) {
    Write-Output "SUCCESS"
} else {
    Write-Output "FAILED"
}`;
      
      try {
        fs.writeFileSync(tempScriptPath, testMinimizeContent, 'utf8');
        scriptPath = tempScriptPath;
      } catch (err) {
        logger.log('一時ファイルの作成に失敗しました: ' + err.message);
        return;
      }
    }
    
    try {
      exec(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, (error, stdout, stderr) => {
        // 一時ファイルの場合は削除
        if (scriptPath.includes('temp_minimize_browser.ps1')) {
          try {
            if (fs.existsSync(scriptPath)) {
              fs.unlinkSync(scriptPath);
            }
          } catch (err) {
            // 削除エラーは無視
          }
        }
        
        if (error) {
          logger.log('ブラウザウィンドウの最小化中にエラーが発生しました: ' + error.message);
          if (stderr) {
            logger.log('エラー詳細: ' + stderr);
          }
        } else if (stdout) {
          const result = stdout.trim();
          if (result === 'SUCCESS') {
            logger.log('ブラウザウィンドウを最小化しました');
          } else {
            logger.log('ブラウザウィンドウの最小化に失敗しました（結果: ' + result + '）');
          }
        } else {
          logger.log('ブラウザウィンドウの最小化中にエラーが発生しました: 出力がありません');
        }
      });
    } catch (err) {
      logger.log('ブラウザウィンドウの最小化中にエラーが発生しました: ' + err.message);
    }
  }


  // タイムアウト設定（環境変数から取得、デフォルト10秒）
  const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || '10000', 10);
  let shutdownTimer = null;
  let isShuttingDown = false;

  // タイムアウト状態を確認するAPI
  app.get('/api/status', (req, res) => {
    if (isShuttingDown) {
      res.json({ status: 'shutting_down', message: 'サーバーは終了しています' });
    } else {
      res.json({ status: 'running', message: 'サーバーは実行中です' });
    }
  });

  // ブラウザウィンドウを最小化するAPI（クライアントから呼び出し可能）
  app.post('/api/minimize-browser', (req, res) => {
    minimizeBrowserWindow();
    res.json({ success: true, message: 'ブラウザウィンドウを最小化しました' });
  });

  // サーバー起動
  const server = app.listen(PORT, () => {
    const logFile = getLogFileName();
    console.log(`ログファイル: ${logFile}`);
    
    // ログファイルの書き込みテスト
    try {
      const testMessage = `[${new Date().toISOString()}] [INFO] ログファイルの書き込みテスト\n`;
      fs.appendFileSync(logFile, testMessage, 'utf8');
      console.log('ログファイルへの書き込みテスト: 成功');
      
      // ファイルが存在することを確認
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        console.log(`ログファイルのサイズ: ${stats.size} bytes`);
      }
    } catch (testErr) {
      console.error('ログファイルへの書き込みテスト: 失敗', testErr.message);
      console.error('エラー詳細:', testErr);
    }
    
    logger.log(`サーバーが起動しました: http://localhost:${PORT}`);
    logger.log('SwitchBot APIを使用して電源を制御できます');
    logger.log(`タイムアウト: ${TIMEOUT_MS / 1000}秒後に自動終了します`);
    
    // ブラウザを自動で開く（少し待機してから開く）
    setTimeout(() => {
      openBrowser();
    }, 1000);

    // タイムアウト処理を設定
    shutdownTimer = setTimeout(() => {
      logger.log(`\n⏰ タイムアウト（${TIMEOUT_MS / 1000}秒）によりサーバーを終了します...`);
      isShuttingDown = true;
      
      // まずブラウザウィンドウを最小化（少し待機してから実行）
      if (process.platform === 'win32') {
        logger.log('ブラウザウィンドウを最小化します...');
        // ブラウザウィンドウが確実にアクティブになるまで少し待機
        setTimeout(() => {
          minimizeBrowserWindow();
        }, 200);
      }
      
      // 少し待ってからサーバーを閉じる（クライアントに通知する時間を確保）
      setTimeout(() => {
        server.close(() => {
          logger.log('サーバーを終了しました');
          // プロセスを終了（ターミナルウィンドウも閉じる）
          process.exit(0);
        });
      }, 1000); // 最小化の時間を確保するため、少し長めに待つ
    }, TIMEOUT_MS);
  });

  // エラーハンドリング
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`\n❌ エラー: ポート${PORT}は既に使用されています。`);
      
      // Windowsの場合、再度プロセス停止を試みる
      if (process.platform === 'win32') {
        logger.log('既存のプロセスを停止しようとしています...');
        killProcessOnPort(PORT);
        
        // 少し待ってから再試行
        setTimeout(() => {
          logger.log('再起動を試みます...');
          const newServer = app.listen(PORT, () => {
            logger.log(`サーバーが起動しました: http://localhost:${PORT}`);
            logger.log('SwitchBot APIを使用して電源を制御できます');
            
            // ブラウザを自動で開く（少し待機してから開く）
            setTimeout(() => {
              openBrowser();
            }, 1000);
          });
          
          newServer.on('error', (retryError) => {
            if (retryError.code === 'EADDRINUSE') {
              logger.error(`\n❌ ポート${PORT}の解放に失敗しました。`);
              logger.log('以下のいずれかを試してください:');
              logger.log('1. 手動で既存のサーバーを停止してください');
              logger.log('2. .envファイルでPORTを変更してください（例: PORT=3001）');
              logger.log('3. タスクマネージャーでnode.exeプロセスを終了してください\n');
              keepConsoleOpen();
            }
          });
        }, 2000);
      } else {
        logger.log('以下のいずれかを試してください:');
        logger.log('1. 既に起動しているサーバーを停止してください');
        logger.log('2. .envファイルでPORTを変更してください（例: PORT=3001）\n');
        keepConsoleOpen();
      }
    } else {
      logger.error('サーバー起動エラー: ' + error.message);
      keepConsoleOpen();
    }
  });

  // 未処理のエラーをキャッチ
  process.on('uncaughtException', (error) => {
    logger.error('\n❌ 予期しないエラーが発生しました:');
    logger.error(error.stack || error.toString());
    // タイムアウトタイマーをクリア
    if (shutdownTimer) {
      clearTimeout(shutdownTimer);
    }
    keepConsoleOpen();
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('\n❌ 未処理のPromise拒否が発生しました:');
    logger.error(reason ? (reason.stack || reason.toString()) : '不明なエラー');
    // タイムアウトタイマーをクリア
    if (shutdownTimer) {
      clearTimeout(shutdownTimer);
    }
    keepConsoleOpen();
  });

  // プロセス終了時のクリーンアップ
  process.on('SIGINT', () => {
    logger.log('\nプロセスを終了します...');
    if (shutdownTimer) {
      clearTimeout(shutdownTimer);
    }
    if (server) {
      server.close(() => {
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });

  process.on('SIGTERM', () => {
    logger.log('\nプロセスを終了します...');
    if (shutdownTimer) {
      clearTimeout(shutdownTimer);
    }
    if (server) {
      server.close(() => {
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
}

