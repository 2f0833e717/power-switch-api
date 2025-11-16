require('dotenv').config();
const SwitchBotAPI = require('./switchbot');

async function getDevices() {
  // 環境変数の確認
  if (!process.env.SWITCHBOT_TOKEN || !process.env.SWITCHBOT_SECRET) {
    console.error('❌ エラー: .envファイルにSWITCHBOT_TOKENとSWITCHBOT_SECRETが設定されていません');
    console.log('\n以下の手順で設定してください:');
    console.log('1. .envファイルを開く');
    console.log('2. SWITCHBOT_TOKENとSWITCHBOT_SECRETに実際の値を設定');
    process.exit(1);
  }

  console.log('🔍 SwitchBotデバイスリストを取得中...\n');

  try {
    const switchbot = new SwitchBotAPI(
      process.env.SWITCHBOT_TOKEN,
      process.env.SWITCHBOT_SECRET
    );

    const devices = await switchbot.getDevices();

    if (devices.body && devices.body.deviceList) {
      console.log('✅ デバイスが見つかりました:\n');
      console.log('='.repeat(80));
      
      devices.body.deviceList.forEach((device, index) => {
        console.log(`\n[${index + 1}] ${device.deviceName}`);
        console.log(`    デバイスID: ${device.deviceId}`);
        console.log(`    タイプ: ${device.deviceType}`);
        if (device.deviceMac) {
          console.log(`    MAC: ${device.deviceMac}`);
        }
      });

      console.log('\n' + '='.repeat(80));
      console.log('\n💡 デバイスIDを.envファイルに設定する場合:');
      console.log('   DEVICE_ID=上記のデバイスIDのいずれかをコピー');
      console.log('\n💡 または、Webアプリからデバイスを選択して使用することもできます。');
    } else {
      console.log('⚠️  デバイスが見つかりませんでした');
      console.log('   SwitchBot Hubが正しく接続されているか確認してください。');
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
    console.log('\nトラブルシューティング:');
    console.log('1. .envファイルのトークンとシークレットが正しいか確認');
    console.log('2. SwitchBot Hubがインターネットに接続されているか確認');
    console.log('3. SwitchBotアプリでデバイスが表示されるか確認');
    process.exit(1);
  }
}

getDevices();

