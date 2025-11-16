const fs = require('fs');
const path = require('path');

/**
 * SUMMARY.mdを生成
 * 
 * docsディレクトリ内のMarkdownファイルを走査し、目次を生成します。
 * - ファイルシステムの階層構造をそのまま反映
 * - ディレクトリ名を親項目として表示
 * - 各MDファイルを対応するディレクトリの下に配置
 * - 同じタイプ内ではアルファベット順にソート
 * - book, node_modules, .git などの特定ディレクトリを除外
 * - MDファイルがないフォルダは無視
 * - apiディレクトリの内容は最後に配置
 */
function generateSummary() {
    // 除外するディレクトリのリスト
    const EXCLUDED_DIRECTORIES = ['.venv', '.specstory', 'src', 'tests', 'book', 'node_modules', '.git'];
    
    const rootDir = path.join(__dirname, '../');
    const docsDir = path.join(rootDir, 'docs'); // docsディレクトリのパス（出力先）
    const systemDesignDir = path.join(docsDir, 'System-design'); // System-designディレクトリ
    const apiDir = path.join(docsDir, 'api'); // apiディレクトリの直接パス - System-designの下ではなくdocsの直下にある
    const summary = ['# Summary\n'];
    
    // デバッグログを出力
    console.log(`docsDir: ${docsDir}`);
    console.log(`systemDesignDir: ${systemDesignDir}`);
    console.log(`apiDir: ${apiDir}`);
    console.log(`apiDir exists: ${fs.existsSync(apiDir)}`);
    
    // 処理済みファイルパスを追跡するセット
    const processedFiles = new Set();
    
    // メインコンテンツを格納
    const mainEntries = [];

    /**
     * ディレクトリ内にMDファイルが存在するか確認する
     * @param {string} dir 確認するディレクトリパス
     * @return {boolean} MDファイルが存在するか
     */
    function hasMdFiles(dir) {
        try {
            const files = fs.readdirSync(dir);
            
            // ディレクトリ内に直接MDファイルがあるか確認
            if (files.some(file => file.endsWith('.md'))) {
                return true;
            }
            
            // サブディレクトリを再帰的に確認
            return files.some(file => {
                const filePath = path.join(dir, file);
                return fs.statSync(filePath).isDirectory() && 
                       !EXCLUDED_DIRECTORIES.includes(file) && 
                       hasMdFiles(filePath);
            });
        } catch (error) {
            console.error(`Error checking directory ${dir}: ${error.message}`);
            return false;
        }
    }

    /**
     * ファイル名に基づいてソート優先度を返す
     * @param {string} fileName ファイル名
     * @return {number} 優先度（低いほど先頭）
     */
    function getSortPriority(fileName) {
        if (fileName === 'index.md') return 0;
        if (fileName === 'README.md') return 1;
        return 100; // その他のファイル
    }

    /**
     * ファイルのパスが既に処理されているか確認
     * @param {string} filePath ファイルパス
     * @return {boolean} 処理済みかどうか
     */
    function isFileProcessed(filePath) {
        const normalizedPath = path.normalize(filePath);
        if (processedFiles.has(normalizedPath)) {
            return true;
        }
        processedFiles.add(normalizedPath);
        return false;
    }

    /**
     * ディレクトリとファイルを処理し、目次エントリを生成
     * @param {string} dir 処理するディレクトリパス
     * @param {number} depth インデントの深さ
     * @param {boolean} isSystemDesign System-design以下のディレクトリかどうか
     * @param {boolean} skipApi APIディレクトリをスキップするかどうか
     */
    function processDirectory(dir, depth = 0, isSystemDesign = false, skipApi = true) {
        const files = fs.readdirSync(dir);
        
        // ディレクトリ名を取得（ルートレベルの特別処理）
        let dirName = path.basename(dir).replace(/-/g, ' ').replace(/^\d+\s*/, '');
        if (dir === docsDir) {
            // docsディレクトリはスキップ
            processSystemDesign(systemDesignDir, depth);
            
            // APIセクションを独立したトップレベル要素として追加（System-designの後に）
            // これによりAPIは2.1.のような番号付けになる
            addApiSection(depth);
            
            return;
        }
        
        // System-designディレクトリの特別処理
        if (dir === systemDesignDir) {
            // System designをトップレベルの項目として追加
            mainEntries.push(`${'  '.repeat(depth)}- [System design]()`);
            
            // index.mdファイルを先に処理
            const indexPath = path.join(dir, 'index.md');
            if (fs.existsSync(indexPath) && !isFileProcessed(indexPath)) {
                const relativePath = path.relative(docsDir, indexPath).replace(/\\/g, '/');
                mainEntries.push(`${'  '.repeat(depth+1)}- [index](${relativePath})`);
            }
            
            // 他のファイルとディレクトリを処理
            processDirectoryContents(dir, depth+1, isSystemDesign, skipApi);
            
            // APIセクションはdocsディレクトリ処理時に独立して追加するため、ここでは追加しない
            
            return;
        }
        
        // 通常のディレクトリ処理
        if (isSystemDesign) {
            mainEntries.push(`${'  '.repeat(depth)}- [${dirName}]()`);
            processDirectoryContents(dir, depth+1, isSystemDesign, skipApi);
        }
    }

    /**
     * ディレクトリの内容を処理
     */
    function processDirectoryContents(dir, depth, isSystemDesign, skipApi) {
        const files = fs.readdirSync(dir);

        // ファイルとディレクトリを分離してソート
        const sortedItems = files
            .map(file => ({
                name: file,
                path: path.join(dir, file),
                isDirectory: fs.statSync(path.join(dir, file)).isDirectory()
            }))
            .sort((a, b) => {
                // ディレクトリを先に、同じタイプ内では優先度付きソート
                if (a.isDirectory !== b.isDirectory) {
                    return a.isDirectory ? -1 : 1;
                }
                
                // ファイルの場合、特定のファイルを優先
                if (!a.isDirectory) {
                    const priorityA = getSortPriority(a.name);
                    const priorityB = getSortPriority(b.name);
                    
                    if (priorityA !== priorityB) {
                        return priorityA - priorityB;
                    }
                }
                
                return a.name.localeCompare(b.name);
            });

        // 各ディレクトリとファイルを処理
        for (const item of sortedItems) {
            // ルートのindex.mdはすでに処理済みなのでスキップ
            if (!item.isDirectory && item.name === 'index.md' && dir === systemDesignDir) continue;
            
            if (item.isDirectory) {
                // 除外ディレクトリかどうか確認
                if (!EXCLUDED_DIRECTORIES.includes(item.name)) {
                    // APIディレクトリはスキップ（別途追加）
                    if (skipApi && item.name === 'api') continue;
                    
                    // MDファイルがあるディレクトリのみ処理
                    if (hasMdFiles(item.path)) {
                        // サブディレクトリを処理
                        processDirectory(item.path, depth, isSystemDesign, skipApi);
                    }
                }
            } else if (item.name.endsWith('.md') && item.name !== 'SUMMARY.md') {
                // すでに処理済みのファイルはスキップ
                if (isFileProcessed(item.path)) continue;
                
                const relativePath = path.relative(docsDir, item.path).replace(/\\/g, '/');
                const title = path.basename(item.name, '.md').replace(/-/g, ' ');
                
                // 項番は表示しない
                const line = `${'  '.repeat(depth)}- [${title}](${relativePath})`;
                mainEntries.push(line);
            }
        }
    }
    
    /**
     * System-designディレクトリのみを処理する特別関数
     */
    function processSystemDesign(dir, depth) {
        if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
            processDirectory(dir, depth, true);
        }
    }
    
    /**
     * APIセクションを追加する関数
     */
    function addApiSection(depth) {
        console.log(`Adding API section at depth ${depth}`);
        // APIディレクトリ名を追加
        mainEntries.push(`${'  '.repeat(depth)}- [api]()`);
        
        // APIディレクトリが存在する場合は中身も処理
        if (fs.existsSync(apiDir) && fs.statSync(apiDir).isDirectory()) {
            console.log("API directory exists, processing contents");
            processDirectoryContents(apiDir, depth+1, true, false);
        } else {
            console.log("API directory does not exist, adding placeholder entry");
            // ダミーのコンテンツ
            mainEntries.push(`${'  '.repeat(depth+1)}- [Documentation will be added soon]()`);
        }
    }

    // docsディレクトリから処理を開始
    processDirectory(docsDir, 0);

    // エントリーを目次に追加
    summary.push(...mainEntries);
    
    // SUMMARY.mdを書き出し（docsディレクトリに出力）
    fs.writeFileSync(path.join(docsDir, 'SUMMARY.md'), summary.join('\n'));
    console.log(`SUMMARY.md has been generated in ${docsDir}`);
    console.log(`Total entries: ${mainEntries.length}`);
}

generateSummary(); 