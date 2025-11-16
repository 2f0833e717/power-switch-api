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
    
    if (!deviceId) {
        showStatus('デバイスを選択してください', 'error');
        return;
    }
    
    try {
        turnOffBtn.disabled = true;
        showStatus('電源をOffにしています...', 'info');
        
        const response = await fetch('/api/turn-off', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ deviceId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showStatus('✅ 電源をOffにしました', 'success');
        } else {
            throw new Error(data.error || '電源のOffに失敗しました');
        }
    } catch (error) {
        console.error('電源Offエラー:', error);
        showStatus(`エラー: ${error.message}`, 'error');
    } finally {
        turnOffBtn.disabled = false;
    }
}

// 明るさを設定する
async function setBrightness(brightness) {
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
    
    if (!deviceId) {
        showStatus('デバイスを選択してください', 'error');
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
            showStatus(`✅ ${data.message}`, 'success');
        } else {
            throw new Error(data.error || '明るさの設定に失敗しました');
        }
    } catch (error) {
        console.error('明るさ設定エラー:', error);
        showStatus(`エラー: ${error.message}`, 'error');
    }
}

// スライダーの値が変更されたときの処理
brightnessSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    brightnessValue.textContent = value;
    
    // デバウンス: スライダーを動かしている間はAPIを呼ばず、500ms後に呼び出す
    clearTimeout(brightnessTimeout);
    brightnessTimeout = setTimeout(() => {
        setBrightness(value);
    }, 500);
});

// スライダーを離したときにも即座に設定（念のため）
brightnessSlider.addEventListener('change', (e) => {
    const value = parseInt(e.target.value);
    brightnessValue.textContent = value;
    clearTimeout(brightnessTimeout);
    setBrightness(value);
});

// イベントリスナーの設定
refreshDevicesBtn.addEventListener('click', loadDevices);
turnOnBtn.addEventListener('click', turnOn);
turnOffBtn.addEventListener('click', turnOff);

// ページ読み込み時にデバイスリストを取得
loadDevices();

