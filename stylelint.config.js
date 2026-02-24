/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-order'],
  rules: {
    // プロパティの順序
    'order/properties-alphabetical-order': true,

    // セレクタのクラス名パターン（ケバブケースまたはキャメルケース）
    'selector-class-pattern': [
      '^[a-z][a-zA-Z0-9]*(-[a-z][a-zA-Z0-9]*)*$',
      {
        message: 'クラス名はケバブケースまたはキャメルケースで記述してください',
      },
    ],

    // カスタムプロパティのパターン
    'custom-property-pattern': [
      '^[a-z][a-zA-Z0-9]*(-[a-z][a-zA-Z0-9]*)*$',
      {
        message: 'カスタムプロパティはケバブケースで記述してください',
      },
    ],

    // 色の指定方法
    'color-hex-length': 'short',
    'color-named': 'never',

    // フォント
    'font-family-name-quotes': 'always-where-recommended',

    // その他
    'declaration-block-no-redundant-longhand-properties': true,
    'shorthand-property-no-redundant-values': true,

    // CSS Modules対応
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global', 'local'],
      },
    ],
  },
  ignoreFiles: ['dist/**', 'node_modules/**', 'coverage/**'],
};
