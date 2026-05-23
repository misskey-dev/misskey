---
name: working-on-frontend
description: Use whenever editing or adding code under `packages/frontend/`, or editing `locales/ja-JP.yml` for frontend-facing UI text — including Vue 3 SFCs (`Mk*` components), i18n keys (`i18n.ts.<key>` / `i18n.tsx.<key>()`), SCSS Modules, theme/CSS variables, `os.*` UI helpers, and Storybook stories. Covers SPDX (HTML comment form), `<script setup lang="ts">` conventions, type-only defineProps, `ja-JP.yml`-only locale editing (other locale yml files are Crowdin-managed and must not be edited), and accessibility. Must be consulted before any frontend or UI-locale change to avoid CI failures, lost translations, and reviewer pushback. This is NOT waived by having already invoked brainstorming, writing-plans, or any other upstream skill — invoke this at implementation time regardless of what preceded it.
---

# working-on-frontend

`packages/frontend/` (Misskey Web クライアント) を編集するとき、最初に参照するスキル。Vue 3 SFC / SCSS Modules / i18n / `os.*` / Storybook / アクセシビリティの **手順** と **背景知識** をまとめている。

SKILL.md 本体は references への索引だけ。具体的な手順や規約は該当ファイルを Read すること (progressive disclosure)。

> **他スキル実行後も免除されない。** `brainstorming` / `writing-plans` / その他アップストリームスキルを先に呼んでいても、`packages/frontend/` に触れる実装フェーズに入る時点でこのスキルを呼ぶこと。

## 作業別ワークフロー (tasks)

タスク単位の完結したチェックリスト。新しい何かを足すときに開く。

- 新規 / 既存 `Mk*` Vue コンポーネントを追加・改修する → [references/tasks/adding-mk-component.md](references/tasks/adding-mk-component.md)
- i18n キーを追加・改修する (`locales/ja-JP.yml` 編集) → [references/tasks/adding-i18n-key.md](references/tasks/adding-i18n-key.md)

## 共通知識 (knowledge)

タスクに紐付かない参照リファレンス。SFC を **編集する** 場面 (新規追加でなくても) で踏みうる規約。

- `<script setup>` / type-only `defineProps` / `defineEmits` / generic SFC / v-model 連動など SFC 規約 → [references/knowledge/component-conventions.md](references/knowledge/component-conventions.md)
- `i18n.ts.<key>` / `i18n.tsx.<key>(...)` の使い分け / HTML タグ埋め込み / 動的キー切替 / 既存キーのリネーム手順 → [references/knowledge/i18n-usage.md](references/knowledge/i18n-usage.md)
- SCSS Modules / `--MI_THEME-*` `--MI-*` CSS 変数 / グローバル utility class (`_button` 等) → [references/knowledge/scss-modules.md](references/knowledge/scss-modules.md)
- `os.alert` / `os.confirm` / `os.popup` 等 UI ヘルパー (ブラウザ標準 `alert()` 直呼びは禁止) → [references/knowledge/os-api.md](references/knowledge/os-api.md)
- `*.stories.impl.ts` 併設規則 + 複数 story / argTypes / layout / action パターン → [references/knowledge/storybook.md](references/knowledge/storybook.md)
- frontend Vitest / Cypress E2E の書き方と前提 → [references/knowledge/frontend-testing.md](references/knowledge/frontend-testing.md)

## 必ず最後に通る場所

frontend の変更を commit / PR にする前に、必ず [shipping-misskey-change](../shipping-misskey-change/SKILL.md) の最終チェックリストに従う。`pnpm lint` / SPDX / `ja-JP.yml` のみ編集確認 / CHANGELOG をまとめて確認する。

`.vue` を追加・変更したなら、その出口で [vue-component-reviewer](../../agents/vue-component-reviewer.md) agent (この skill の規約を review-mode から機械チェックする専門 reviewer) を Task で起動すると、SPDX 形式・命名・i18n・SCSS 変数・a11y・Storybook 併設の逸脱を取りこぼしにくい。
