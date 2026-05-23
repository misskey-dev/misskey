# i18n キーを追加・改修する

UI 文言の追加・変更を行う際の手順。**手動編集して良いのは `locales/ja-JP.yml` のみ**。

## 大前提 (絶対 NG)

- **`locales/<lang>.yml` (ja-JP.yml 以外) の編集は禁止**。これらは Crowdin の自動配信先で、手動編集すると次の同期で上書き喪失する ([locales/README.md](../../../../../locales/README.md), [crowdin.yml](../../../../../crowdin.yml))
- 文字列リテラルを SFC に直書きしない (`<span>こんにちは</span>` 等)。必ず `i18n.ts.<key>` を経由する
- 既存キーの破壊的リネームは Crowdin 翻訳資産を失わせる。**追加 → 移行 → 旧キー削除** の 3 段階に分割する。詳細手順と誤編集の復旧は [knowledge/i18n-usage.md §Crowdin 安全策](../knowledge/i18n-usage.md)

## ステップ 1: ja-JP.yml にキーを追加

[locales/ja-JP.yml](../../../../../locales/ja-JP.yml) を編集する。YAML の階層構造を維持し、関連するセクションに配置する:

```yaml
# トップレベル単純キー
save: "保存"

# ネストしたカテゴリ (アンダースコア接頭辞は内部カテゴリ)
_settings:
  general: "全般"
  appearance: "外観"

# パラメータ付き (単純なプレースホルダ置換)
# 受け付けるのは {name} 形式のみ。ICU MessageFormat (plural/select) は非対応
greeting: "こんにちは、{name}さん"
```

### 命名のお作法

- 単純キー: lowerCamelCase (例: `saveChanges`, `confirmDelete`)
- カテゴリ: アンダースコア接頭辞 (例: `_settings`, `_abuseUserReport`)
- 既存セクション内に追加する場合は **周辺の既存配置・意味グループに合わせる** (例えば `_settings` は機能ブロック順に並んでおりアルファベット順ではない)。新セクション全体を末尾に追加するのは可
- **HTML タグ (`<b>` `<br>` `<strong>` 等) や `:` `'` `&` を含む値は必ずダブルクォートで囲む** (未クォートだと YAML パース失敗)

> ICU 非対応の代替戦略・予約キー `_lang_`・Storybook での挙動は → [knowledge/i18n-usage.md §制約と補足](../knowledge/i18n-usage.md)

## ステップ 2: 型定義の自動再生成

`packages/i18n/build.ts` が `ja-JP.yml` を解析し、TypeScript インターフェースを [packages/i18n/src/autogen/locale.ts](../../../../../packages/i18n/src/autogen/locale.ts) に出力する。

### 自動 (推奨)

`pnpm dev` 実行中なら、`packages/i18n` の watch スクリプト (`nodemon ... tsx ./build.ts --watch`) が yml の変更を検知して自動再生成する。

### 手動

```bash
pnpm --filter i18n generate
```

実体は `tsx scripts/generateLocaleInterface.ts`。

### 失敗パターン

これを実行せずに frontend 側で `i18n.ts.<newKey>` を参照すると、`Locale` インターフェースに追加されていないため typecheck で `Property '<newKey>' does not exist on type 'Locale'` というエラーになる (`pnpm --filter frontend lint` で発覚)。型エラー・実行時警告 (`Unexpected locale key`, `Missing locale parameters`) と対処は → [knowledge/i18n-usage.md §トラブルシュート](../knowledge/i18n-usage.md)。

## ステップ 3: frontend での参照

```ts
import { i18n } from '@/i18n.js';
```

| 用途 | 書き方 |
|---|---|
| 単純文字列 | `i18n.ts.save` |
| ネスト | `i18n.ts._settings.general` |
| パラメータ付き | `i18n.tsx.greeting({ name: userName })` |
| Vue テンプレート内 | `{{ i18n.ts.save }}` / `{{ i18n.tsx.greeting({ name }) }}` |

`i18n.ts` は型付き文字列、`i18n.tsx` は MessageFormat 関数 (パラメータあり値のみ存在)。

> HTML タグ埋め込み・computed によるリアクティブ参照・動的キー切替・ブラケット記法 (`i18n.ts['2fa']`) などの実装パターンは → [knowledge/i18n-usage.md §実装パターン](../knowledge/i18n-usage.md)

## ステップ 4: 検証

```bash
# i18n の型再生成 → typecheck + eslint (lint は generate を呼ばないので順番が必須)
pnpm --filter i18n generate
pnpm --filter i18n lint

# frontend で新キー参照箇所の型チェック
pnpm --filter frontend lint

# 他言語 yml に diff が出ていないことを確認 (出力が空であれば OK)
git diff --name-only develop -- 'locales/*.yml' | grep -v '^locales/ja-JP\.yml$'
```

> `grep -v 'ja-JP.yml'` を **diff 本文** に当てると ja-JP.yml 単体の変更でも `+追加行` が素通りして必ず非空になる。`--name-only` でファイル名だけに絞ってから完全一致で除外するのが正しい。

ユーザー影響のある UI 変更を伴う場合は [shipping-misskey-change スキル](../../../shipping-misskey-change/SKILL.md) で CHANGELOG エントリの判定をする。

## 例: 「ノートを削除しますか？」確認ダイアログを追加する

1. `locales/ja-JP.yml`:
   ```yaml
   _notes:
     deleteConfirm: "このノートを削除しますか？"
   ```
2. `pnpm --filter i18n generate` (または `pnpm dev` で watch 中)
3. SFC:
   ```vue
   <script setup lang="ts">
   import { i18n } from '@/i18n.js';
   import * as os from '@/os.js';

   async function onDelete() {
     const { canceled } = await os.confirm({
       type: 'warning',
       text: i18n.ts._notes.deleteConfirm,
     });
     if (canceled) return;
     // 削除処理
   }
   </script>
   ```

## 参照ファイル

- [locales/README.md (★ 編集ポリシー根拠)](../../../../../locales/README.md)
- [locales/ja-JP.yml](../../../../../locales/ja-JP.yml)
- [packages/i18n/build.ts](../../../../../packages/i18n/build.ts)
- [packages/i18n/src/autogen/locale.ts (生成物)](../../../../../packages/i18n/src/autogen/locale.ts)
- [packages/frontend/src/i18n.ts](../../../../../packages/frontend/src/i18n.ts)
