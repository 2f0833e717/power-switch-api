/**
 * streamで生成されたHTMLファイルを加工するシンプルなスクリプト
 * HTMLからSVG部分を抽出し、基本的なハイライト機能のみを追加します
 */
const fs = require('fs');
const path = require('path');

// コマンドライン引数からファイルパスを取得
const streamHtmlPath = process.argv[2];
const outputHtmlPath = process.argv[3];

if (!streamHtmlPath || !outputHtmlPath) {
  console.error('使用方法: node wrap-html.js <STREAM_HTML_PATH> <OUTPUT_HTML_PATH>');
  process.exit(1);
}

// streamで生成されたHTMLファイルを読み込む
let streamHtmlContent;
try {
  streamHtmlContent = fs.readFileSync(streamHtmlPath, 'utf8');
} catch (error) {
  console.error(`HTMLファイルの読み込みに失敗しました: ${error.message}`);
  process.exit(1);
}

// SVG部分を抽出
let svgContent = '';
const svgRegex = /<svg.*?<\/svg>/s;
const svgMatch = streamHtmlContent.match(svgRegex);

if (svgMatch && svgMatch[0]) {
  svgContent = svgMatch[0];
} else {
  console.error('HTMLファイルからSVG部分を抽出できませんでした');
  process.exit(1);
}

// スクリプト部分を抽出
let scriptContent = '';
const scriptRegex = /<script>[\s\S]*?<\/script>/;
const scriptMatch = streamHtmlContent.match(scriptRegex);

if (scriptMatch && scriptMatch[0]) {
  scriptContent = scriptMatch[0];
} else {
  console.error('HTMLファイルからスクリプト部分を抽出できませんでした');
  process.exit(1);
}

// streamのスタイル部分を抽出
let styleContent = '';
const styleRegex = /<style>[\s\S]*?<\/style>/;
const styleMatch = streamHtmlContent.match(styleRegex);

if (styleMatch && styleMatch[0]) {
  styleContent = styleMatch[0];
} else {
  console.error('HTMLファイルからスタイル部分を抽出できませんでした');
  process.exit(1);
}

// VSCodeリンクの不正なパス部分を修正
const currentDir = process.cwd().replace(/\\/g, '\\\\');
const baseDir = path.basename(currentDir);

// 不正なリンクパターンを検出して修正
const linkRegex = /vscode:\/\/file\/([^"]*?)\/([^"]*)/g;
svgContent = svgContent.replace(linkRegex, (match, prefix, suffix) => {
  // 不正なパスパターンを検出
  if (prefix.includes('dependency-cruiser output') || prefix.includes('Cursordependency-cruiser output')) {
    // 修正済みパスを返す
    return `vscode://file/${currentDir.replace(/\\\\/g, '/')}/${suffix}`;
  }
  // 問題がなければそのまま返す
  return match;
});

// ファイル名からビュータイプを推測
const isArchiView = streamHtmlPath.includes('archi');
const viewTitle = isArchiView ? 'アーキテクチャビュー - モジュール依存関係' : 'モジュール依存関係';

// HTMLテンプレートを作成
const htmlContent = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${viewTitle}</title>
  ${styleContent}
  <style>
    :root {
      --bg-color: #1e1e1e;
      --header-bg: #333;
      --graph-bg: #000;
      --text-color: #fff;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
    }
    
    .header {
      background-color: var(--header-bg);
      padding: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .title {
      font-size: 1.2rem;
      margin: 0;
    }
    
    .graph-container {
      background-color: var(--graph-bg);
      overflow: auto;
      height: calc(100vh - 50px);
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">${viewTitle}</h1>
  </div>
  
  <div class="graph-container" id="graph-container">
    <button id="button_help">?</button>
    <div id="hints" class="hint" style="display: none">
      <button id="close-hints">x</button>
      <span id="hint-text"></span>
      <ul>
        <li><b>Hover</b> - highlight</li>
        <li><b>Right-click</b> - pin highlight</li>
        <li><b>ESC</b> - clear</li>
      </ul>
    </div>
    ${svgContent}
  </div>
  
  ${scriptContent}
  <script>
    // オレンジ色のテキストを黒色に変更
    function updateSvgColors(bgColor, pathColor) {
      // 背景用のpolygon要素
      document.querySelectorAll('polygon[points*="-4,4"]').forEach(polygon => {
        polygon.setAttribute('fill', bgColor);
      });
      
      // 白色の塗りつぶしを持つpath要素
      document.querySelectorAll('path[fill="#ffffff"]').forEach(path => {
        path.setAttribute('fill', bgColor);
      });
      
      // その他の白色の要素
      document.querySelectorAll('[fill="white"]').forEach(elem => {
        elem.setAttribute('fill', bgColor);
      });
      
      // オレンジ色のストロークを黒色に変更
      document.querySelectorAll('[stroke="orange"]').forEach(elem => {
        elem.setAttribute('stroke', 'black');
      });
      
      // オレンジ色のテキストを黒色に変更
      document.querySelectorAll('text[fill="orange"]').forEach(text => {
        text.setAttribute('fill', 'black');
      });
    }
    
    // VSCodeパスの修正
    document.querySelectorAll(".node").forEach(node => {
      const link = node.querySelector("a");
      if (link && link.getAttribute("xlink:href")) {
        // リンクがあれば、不正なパスを修正
        const href = link.getAttribute("xlink:href");
        if (href.includes("dependency-cruiser output") || href.includes("Cursordependency-cruiser output")) {
          // 不正なパスを検出したら修正
          const suffix = href.split('/').slice(-4).join('/'); // ファイルパスの最後の部分を取得
          const fixedHref = "vscode://file/" + "${currentDir}".replace(/\\\\/g, '/') + "/" + suffix.split('/').pop();
          link.setAttribute("xlink:href", fixedHref);
        }
      }
    });
    
    // 初期状態で背景色を設定
    updateSvgColors('#808080', '#ffffff');
  </script>
</body>
</html>`;

// 出力ディレクトリを確認し、必要なら作成
const outputDir = path.dirname(outputHtmlPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// HTMLファイルを書き込む
try {
  fs.writeFileSync(outputHtmlPath, htmlContent);
  console.log(`HTMLファイルを生成しました: ${outputHtmlPath}`);
} catch (error) {
  console.error(`HTMLファイルの書き込みに失敗しました: ${error.message}`);
  process.exit(1);
} 