// DOM要素の取得
const deviceSelect = document.getElementById('deviceSelect');
const refreshDevicesBtn = document.getElementById('refreshDevices');
const turnOnBtn = document.getElementById('turnOnBtn');
const turnOffBtn = document.getElementById('turnOffBtn');
const statusMessage = document.getElementById('statusMessage');
const brightnessSlider = document.getElementById('brightnessSlider');
const brightnessValue = document.getElementById('brightnessValue');

// 明るさ設定のデバウンス用タイマー
let brightnessTimeout = null;

// サーバー状態監視用のタイマー
let serverStatusCheckInterval = null;

// ステータスメッセージを表示
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    // 3秒後に自動的に消す（エラー以外）
    if (type !== 'error') {
        setTimeout(() => {
            statusMessage.textContent = '';
            statusMessage.className = 'status-message';
        }, 3000);
    }
}

// デバイスリストを取得
async function loadDevices() {
    try {
        showStatus('デバイスを読み込み中...', 'info');
        deviceSelect.disabled = true;
        
        // デフォルトデバイスIDを取得
        const defaultDeviceResponse = await fetch('/api/default-device');
        const defaultDeviceData = await defaultDeviceResponse.json();
        const defaultDeviceId = defaultDeviceData.deviceId;
        
        const response = await fetch('/api/devices');
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'デバイスの取得に失敗しました');
        }
        
        // デバイスリストをクリア
        deviceSelect.innerHTML = '<option value="">デバイスを選択してください</option>';
        
        // デバイスを追加
        if (data.body && data.body.deviceList) {
            data.body.deviceList.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = `${device.deviceName} (${device.deviceType})`;
                deviceSelect.appendChild(option);
                
                // デフォルトデバイスIDと一致する場合は自動選択
                if (defaultDeviceId && device.deviceId === defaultDeviceId) {
                    option.selected = true;
                }
            });
        }
        
        if (deviceSelect.options.length === 1) {
            showStatus('デバイスが見つかりませんでした', 'error');
        } else {
            if (defaultDeviceId && deviceSelect.value === defaultDeviceId) {
                showStatus('✅ デバイスを読み込みました（デフォルトデバイスが選択されています）', 'success');
                // 初期化処理: 電源OFFと明るさを最小値に設定
                initializeDevice(defaultDeviceId);
            } else {
                showStatus('デバイスを読み込みました', 'success');
            }
        }
    } catch (error) {
        console.error('デバイス読み込みエラー:', error);
        showStatus(`エラー: ${error.message}`, 'error');
        deviceSelect.innerHTML = '<option value="">デバイスの読み込みに失敗しました</option>';
    } finally {
        deviceSelect.disabled = false;
    }
}

// デバイスの初期化処理（電源OFFと明るさを0に設定）
async function initializeDevice(deviceId) {
    try {
        // 電源をOFFにする
        await turnOffDevice(deviceId, true);
        
        // スライダーと表示を0に更新（UIのみ、APIは呼ばない）
        brightnessSlider.value = 0;
        brightnessValue.textContent = 0;
        
        console.log('デバイスの初期化が完了しました（電源OFF、明るさ0）');
    } catch (error) {
        // 初期化エラーは静かに処理（ユーザーに大きな影響を与えない）
        console.warn('デバイスの初期化中にエラーが発生しました:', error);
    }
}

// 電源をOffにする（初期化用、サイレントモード対応）
async function turnOffDevice(deviceId, silent = false) {
    if (!deviceId) {
        if (!silent) {
            showStatus('デバイスを選択してください', 'error');
        }
        return;
    }
    
    try {
        if (!silent) {
            turnOffBtn.disabled = true;
            showStatus('電源をOffにしています...', 'info');
        }
        
        const response = await fetch('/api/turn-off', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ deviceId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (!silent) {
                showStatus('✅ 電源をOffにしました', 'success');
            }
        } else {
            throw new Error(data.error || '電源のOffに失敗しました');
        }
    } catch (error) {
        console.error('電源Offエラー:', error);
        if (!silent) {
            showStatus(`エラー: ${error.message}`, 'error');
        }
        throw error;
    } finally {
        if (!silent) {
            turnOffBtn.disabled = false;
        }
    }
}

// 電源をOnにする
async function turnOn() {
    const deviceId = deviceSelect.value;
    
    if (!deviceId) {
        showStatus('デバイスを選択してください', 'error');
        return;
    }
    
    try {
        turnOnBtn.disabled = true;
        showStatus('電源をOnにしています...', 'info');
        
        const response = await fetch('/api/turn-on', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ deviceId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showStatus('✅ 電源をOnにしました', 'success');
        } else {
            throw new Error(data.error || '電源のOnに失敗しました');
        }
    } catch (error) {
        console.error('電源Onエラー:', error);
        showStatus(`エラー: ${error.message}`, 'error');
    } finally {
        turnOnBtn.disabled = false;
    }
}

// 電源をOffにする
async function turnOff() {
    // デバイスIDが選択されていない場合は、デフォルトデバイスIDを使用
    let deviceId = deviceSelect.value;
    
    // デバイスが選択されていない場合、デフォルトデバイスIDを取得
    if (!deviceId) {
        try {
            const defaultDeviceResponse = await fetch('/api/default-device');
            const defaultDeviceData = await defaultDeviceResponse.json();
            deviceId = defaultDeviceData.deviceId;
        } catch (error) {
            console.error('デフォルトデバイス取得エラー:', error);
        }
    }
    
    await turnOffDevice(deviceId, false);
}

// 明るさを設定する
async function setBrightness(brightness, deviceIdParam = null, silent = false) {
    // デバイスIDが選択されていない場合は、デフォルトデバイスIDを使用
    let deviceId = deviceIdParam || deviceSelect.value;
    
    // デバイスが選択されていない場合、デフォルトデバイスIDを取得
    if (!deviceId) {
        try {
            const defaultDeviceResponse = await fetch('/api/default-device');
            const defaultDeviceData = await defaultDeviceResponse.json();
            deviceId = defaultDeviceData.deviceId;
        } catch (error) {
            console.error('デフォルトデバイス取得エラー:', error);
        }
    }
    
    if (!deviceId) {
        if (!silent) {
            showStatus('デバイスを選択してください', 'error');
        }
        return;
    }
    
    try {
        const response = await fetch('/api/set-brightness', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ deviceId, brightness })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (!silent) {
                showStatus(`✅ ${data.message}`, 'success');
            }
        } else {
            throw new Error(data.error || '明るさの設定に失敗しました');
        }
    } catch (error) {
        console.error('明るさ設定エラー:', error);
        if (!silent) {
            showStatus(`エラー: ${error.message}`, 'error');
        }
        throw error;
    }
}

// スライダーの値が変更されたときの処理
brightnessSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    brightnessValue.textContent = value;
    
    // デバウンス: スライダーを動かしている間はAPIを呼ばず、500ms後に呼び出す
    clearTimeout(brightnessTimeout);
    brightnessTimeout = setTimeout(() => {
        setBrightness(value, null, false);
    }, 500);
});

// スライダーを離したときにも即座に設定（念のため）
brightnessSlider.addEventListener('change', (e) => {
    const value = parseInt(e.target.value);
    brightnessValue.textContent = value;
    clearTimeout(brightnessTimeout);
    setBrightness(value, null, false);
});

// イベントリスナーの設定
refreshDevicesBtn.addEventListener('click', loadDevices);
turnOnBtn.addEventListener('click', turnOn);
turnOffBtn.addEventListener('click', turnOff);

// タブを閉じるフラグ
let shouldCloseTab = false;

// タブを閉じる前にブラウザを最小化する処理
function setupBeforeUnloadHandler() {
    window.addEventListener('beforeunload', (event) => {
        // タブを閉じる前にブラウザを最小化するリクエストを送信
        if (shouldCloseTab) {
            console.log('タブを閉じる前にブラウザを最小化します...');
            
            // 非同期で送信（完了を待たない）
            fetch('/api/minimize-browser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                keepalive: true // ページが閉じられてもリクエストを送信
            }).catch(() => {
                // エラーは無視
            });
        }
    });
}

// サーバーの状態を監視して、終了時にタブを閉じる
function startServerStatusMonitoring() {
    // 1秒ごとにサーバーの状態をチェック
    serverStatusCheckInterval = setInterval(async () => {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            if (data.status === 'shutting_down') {
                // サーバーが終了中の場合、タブを閉じるフラグを設定
                console.log('サーバーが終了しています。タブを閉じます...');
                clearInterval(serverStatusCheckInterval);
                
                // タブを閉じるフラグを設定
                shouldCloseTab = true;
                
                // タブを閉じる（beforeunloadイベントでブラウザを最小化）
                setTimeout(() => {
                    // ブラウザタブを閉じる（自動で開いたタブの場合のみ可能）
                    window.close();
                    
                    // タブを閉じられない場合（通常のタブの場合）は、ページをリロードしてエラー表示
                    setTimeout(() => {
                        // タブを閉じられなかった場合、ページにメッセージを表示
                        document.body.innerHTML = `
                            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; font-family: Arial, sans-serif;">
                                <h1>⏰ タイムアウト</h1>
                                <p>サーバーが自動的に終了しました。</p>
                                <p>このタブを閉じてください。</p>
                            </div>
                        `;
                    }, 100);
                }, 100);
            }
        } catch (error) {
            // サーバーに接続できない場合（サーバーが終了した場合）
            console.log('サーバーに接続できません。サーバーが終了した可能性があります。');
            clearInterval(serverStatusCheckInterval);
            
            // タブを閉じるフラグを設定
            shouldCloseTab = true;
            
            // タブを閉じる（beforeunloadイベントでブラウザを最小化）
            setTimeout(() => {
                window.close();
                
                // タブを閉じられない場合
                setTimeout(() => {
                    document.body.innerHTML = `
                        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; font-family: Arial, sans-serif;">
                            <h1>⏰ タイムアウト</h1>
                            <p>サーバーが自動的に終了しました。</p>
                            <p>このタブを閉じてください。</p>
                        </div>
                    `;
                }, 100);
            }, 100);
        }
    }, 1000); // 1秒ごとにチェック
}

// ページ読み込み時にデバイスリストを取得
loadDevices();

// タブを閉じる前にブラウザを最小化するハンドラーを設定
setupBeforeUnloadHandler();

// サーバー状態の監視を開始
startServerStatusMonitoring();

