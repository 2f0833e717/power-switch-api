const crypto = require('crypto');
const axios = require('axios');

const API_ENDPOINT = 'https://api.switch-bot.com/v1.1';

class SwitchBotAPI {
  constructor(token, secret) {
    this.token = token;
    this.secret = secret;
  }

  /**
   * UUIDを生成（Node.js 14互換）
   */
  generateUUID() {
    // Node.js 15.6.0以降ではcrypto.randomUUID()が利用可能
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Node.js 14互換: ランダムなUUIDを生成
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * SwitchBot API用の認証ヘッダーを生成
   */
  createHeaders() {
    const t = Date.now();
    const nonce = this.generateUUID();
    const stringToSign = `${this.token}${t}${nonce}`;
    const sign = crypto
      .createHmac('sha256', this.secret)
      .update(stringToSign, 'utf-8')
      .digest('base64');

    return {
      'Authorization': this.token,
      'Content-Type': 'application/json',
      't': t.toString(),
      'sign': sign,
      'nonce': nonce
    };
  }

  /**
   * デバイスリストを取得
   */
  async getDevices() {
    try {
      const headers = this.createHeaders();
      const response = await axios.get(`${API_ENDPOINT}/devices`, { headers });
      return response.data;
    } catch (error) {
      throw new Error(`デバイスリストの取得に失敗しました: ${error.message}`);
    }
  }

  /**
   * デバイスの電源をOffにする
   * @param {string} deviceId - デバイスID
   */
  async turnOff(deviceId) {
    try {
      const headers = this.createHeaders();
      const url = `${API_ENDPOINT}/devices/${deviceId}/commands`;
      const data = {
        command: 'turnOff',
        parameter: 'default',
        commandType: 'command'
      };

      const response = await axios.post(url, data, { headers });
      return response.data;
    } catch (error) {
      throw new Error(`電源のOffに失敗しました: ${error.message}`);
    }
  }

  /**
   * デバイスの電源をOnにする
   * @param {string} deviceId - デバイスID
   */
  async turnOn(deviceId) {
    try {
      const headers = this.createHeaders();
      const url = `${API_ENDPOINT}/devices/${deviceId}/commands`;
      const data = {
        command: 'turnOn',
        parameter: 'default',
        commandType: 'command'
      };

      const response = await axios.post(url, data, { headers });
      return response.data;
    } catch (error) {
      throw new Error(`電源のOnに失敗しました: ${error.message}`);
    }
  }

  /**
   * デバイスの明るさを設定する
   * @param {string} deviceId - デバイスID
   * @param {number} brightness - 明るさ（1-100）
   */
  async setBrightness(deviceId, brightness) {
    try {
      // 明るさの範囲を検証
      if (brightness < 1 || brightness > 100) {
        throw new Error('明るさは1から100の間で指定してください');
      }

      const headers = this.createHeaders();
      const url = `${API_ENDPOINT}/devices/${deviceId}/commands`;
      const data = {
        command: 'setBrightness',
        parameter: brightness.toString(),
        commandType: 'command'
      };

      const response = await axios.post(url, data, { headers });
      return response.data;
    } catch (error) {
      throw new Error(`明るさの設定に失敗しました: ${error.message}`);
    }
  }
}

module.exports = SwitchBotAPI;

