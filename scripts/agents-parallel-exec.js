#!/usr/bin/env node

/**
 * Autonomous Agent Parallel Executor
 *
 * GitHub IssueをMiyabi Autonomous Agentシステムで自動処理
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// コマンドライン引数を解析
const args = process.argv.slice(2);
const options = {
  issue: null,
  issues: [],
  concurrency: 2,
  dryRun: false,
  logLevel: 'info'
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--issue' && i + 1 < args.length) {
    options.issue = parseInt(args[++i]);
  } else if (arg === '--issues' && i + 1 < args.length) {
    options.issues = args[++i].split(',').map(n => parseInt(n.trim()));
  } else if (arg === '--concurrency' && i + 1 < args.length) {
    options.concurrency = parseInt(args[++i]);
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  } else if (arg === '--log-level' && i + 1 < args.length) {
    options.logLevel = args[++i];
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
🤖 Autonomous Agent Parallel Executor

Usage:
  npm run agents:parallel:exec -- [options]

Options:
  --issue <number>           単一Issue番号
  --issues <n1,n2,...>       複数Issue番号（カンマ区切り）
  --concurrency <number>     並行実行数 (default: 2)
  --dry-run                  実行のみ（変更なし）
  --log-level <level>        ログレベル (default: info)
  --help, -h                 ヘルプ表示

Examples:
  npm run agents:parallel:exec -- --issue 68
  npm run agents:parallel:exec -- --issues 68,69,70 --concurrency 3
  npm run agents:parallel:exec -- --issue 68 --dry-run
`);
    process.exit(0);
  }
}

// .envファイルを読み込む
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// 必須環境変数のチェック
const requiredEnvVars = ['GITHUB_TOKEN', 'REPOSITORY'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`❌ Error: Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('\n💡 Set them in .env file:');
  console.error('GITHUB_TOKEN=ghp_xxx');
  console.error('REPOSITORY=owner/repo');
  process.exit(1);
}

// 処理するIssueリストを決定
const issuesToProcess = options.issue
  ? [options.issue]
  : options.issues.length > 0
    ? options.issues
    : [];

if (issuesToProcess.length === 0) {
  console.error('❌ Error: No issues specified. Use --issue or --issues');
  console.error('Run with --help for usage information');
  process.exit(1);
}

console.log('\n🤖 Autonomous Operations - Parallel Executor\n');

if (options.dryRun) {
  console.log('⚠️  Dry Run: Yes (no changes will be made)\n');
}

console.log('✅ Configuration loaded');
console.log(`   Device: ${process.env.DEVICE_IDENTIFIER || 'Unknown'}`);
console.log(`   Repository: ${process.env.REPOSITORY}`);
console.log(`   Concurrency: ${options.concurrency}`);
console.log('');

// 環境変数を設定
const env = {
  ...process.env,
  MIYABI_JSON: '0',  // TUIモードを使用
  MIYABI_AUTO_YES: '1',
  MIYABI_VERBOSE: options.logLevel === 'verbose' ? '1' : '0'
};

// Issueを処理
for (const issueNumber of issuesToProcess) {
  console.log('='.repeat(80));
  console.log(`🚀 Executing Issue #${issueNumber}`);
  console.log('='.repeat(80));
  console.log('');

  try {
    const command = options.dryRun
      ? `echo "[DRY RUN] Would execute: npx miyabi run -i ${issueNumber} -t add-feature --mode auto --approval auto"`
      : `npx miyabi run -i ${issueNumber} -t add-feature --mode auto --approval auto`;

    execSync(command, {
      stdio: 'inherit',
      env,
      cwd: path.join(__dirname, '..')
    });

    console.log('');
    console.log(`✅ Issue #${issueNumber} completed successfully`);
    console.log('');
  } catch (error) {
    console.error('');
    console.error(`❌ Issue #${issueNumber} failed`);
    console.error(`Error: ${error.message}`);
    console.error('');
    process.exit(1);
  }
}

console.log('✅ All issues processed successfully!');
