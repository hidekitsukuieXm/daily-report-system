/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // タイプの種類
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新機能
        'fix',      // バグ修正
        'docs',     // ドキュメント
        'style',    // フォーマット（コードの動作に影響しない変更）
        'refactor', // リファクタリング
        'perf',     // パフォーマンス改善
        'test',     // テスト追加・修正
        'build',    // ビルドシステム・外部依存関係の変更
        'ci',       // CI設定ファイル・スクリプトの変更
        'chore',    // その他の変更
        'revert',   // コミットの取り消し
      ],
    ],
    // タイプは小文字
    'type-case': [2, 'always', 'lower-case'],
    // タイプは空にしない
    'type-empty': [2, 'never'],
    // サブジェクトは空にしない
    'subject-empty': [2, 'never'],
    // サブジェクトの末尾にピリオドを付けない
    'subject-full-stop': [2, 'never', '.'],
    // ヘッダーは100文字以内
    'header-max-length': [2, 'always', 100],
  },
};
