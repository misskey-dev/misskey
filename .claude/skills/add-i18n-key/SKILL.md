---
name: add-i18n-key
description: Misskey の i18n キーを追加・修正する。locales/ja-JP.yml のみ編集可能で、他言語ファイル (en-US.yml 等 39 言語) は Crowdin の自動配信先のため絶対に触らない。型は packages/i18n が ja-JP.yml から自動再生成する。frontend からは i18n.ts.<key> または i18n.tsx.<key>(...) で参照する。
---

# Misskey i18n キー追加スキル

UI 文言の追加・変更を行う際の規約。**手動編集して良いのは `locales/ja-JP.yml` のみ。**

## 大前提 (絶対 NG)

- **`locales/<lang>.yml` (ja-JP.yml 以外) の編集は禁止**。これらは Crowdin の自動配信先で、手動編集すると次の同期で上書き喪失する ([locales/README.md](../../../locales/README.md), [crowdin.yml](../../../crowdin.yml))。
- 文字列リテラルを SFC に直書きしない (`<span>こんにちは</span>` 等)。必ず `i18n.ts.<key>` を経由する。
- 既存キーの破壊的リネームは Crowdin 翻訳資産も道連れになるので慎重に。追加・改名併用 (新キー追加 → 移行 → 旧キー削除) を検討する。

## ステップ 1: ja-JP.yml にキーを追加

[locales/ja-JP.yml](../../../locales/ja-JP.yml) を編集する。YAML の階層構造を維持し、関連するセクションに配置する:

```yaml
# トップレベル単純キー
save: "保存"

# ネストしたカテゴリ (アンダースコア接頭辞は内部カテゴリ)
_settings:
  general: "全般"
  appearance: "外観"

# パラメータ付き (ICU MessageFormat 互換)
greeting: "こんにちは、{name}さん"
```

### 命名のお作法

- 単純キー: lowerCamelCase (例: `saveChanges`, `confirmDelete`)。
- カテゴリ: アンダースコア接頭辞 (例: `_settings`, `_abuseUserReport`)。
- 既存セクション内に置く場合はアルファベット順を維持する (新セクション全体を末尾に追加するのは可)。

## ステップ 2: 型定義の自動再生成

`packages/i18n/build.ts` が `ja-JP.yml` を解析し、TypeScript インターフェースを [packages/i18n/src/autogen/locale.ts](../../../packages/i18n/src/autogen/locale.ts) に出力する。

### 自動 (推奨)

`pnpm dev` 実行中なら、`packages/i18n` の watch スクリプトが yml の変更を検知して自動再生成する。

### 手動

```bash
pnpm --filter i18n generate
```

実体は `tsx scripts/generateLocaleInterface.ts`。

### 失敗パターン

これを実行せずに frontend 側で `i18n.ts.<newKey>` を参照すると、`Locale` インターフェースに追加されていないため、typecheck で「Property '<newKey>' does not exist on type 'Locale'」というエラーになる。`pnpm --filter frontend lint` で発覚する。

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

`i18n.ts` は型付き文字列、`i18n.tsx` は MessageFormat 関数。

## ステップ 4: 検証

```bash
# i18n パッケージの型再生成 + typecheck
pnpm --filter i18n lint

# frontend で新キー参照箇所の型チェック
pnpm --filter frontend lint
```

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

- [locales/README.md (★ 編集ポリシー根拠)](../../../locales/README.md)
- [locales/ja-JP.yml](../../../locales/ja-JP.yml)
- [packages/i18n/build.ts](../../../packages/i18n/build.ts)
- [packages/i18n/src/autogen/locale.ts (生成物)](../../../packages/i18n/src/autogen/locale.ts)
- [packages/frontend/src/i18n.ts](../../../packages/frontend/src/i18n.ts)
