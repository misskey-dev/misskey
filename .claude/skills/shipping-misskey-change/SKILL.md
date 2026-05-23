---
name: shipping-misskey-change
description: Use at every "finish" moment of a Misskey change — immediately before committing, opening a PR, merging, or handing the work back to the user even without a commit. Runs the final pre-ship checklist — `pnpm lint`, misskey-js regeneration (`pnpm build-misskey-js-with-types`) when backend API changed, `pnpm --filter backend check-migrations` when entities or migrations changed, SPDX header verification on new files, locale safety check (no edits to non-`ja-JP` locale yml files), and `CHANGELOG.md` Unreleased entry for user-visible changes. Must be consulted as the last step of every change — including uncommitted handoffs — to avoid CI failures and lost translations. This is NOT waived by having already invoked brainstorming, writing-plans, or any other upstream skill — invoke this regardless of what preceded it.
---

# shipping-misskey-change

Misskey の変更の **finish 局面** (commit / PR / merge する直前、またはコミットせずユーザーに作業を返す直前) に必ず走らせる最終チェックリスト。

CI で落ちやすい / レビュアーから指摘されやすいポイントを 1 箇所に集めている。後で references を辿る余裕を作らないため、チェックリストは SKILL.md 本体に直書きする。

> **他スキル実行後も免除されない。** `brainstorming` / `writing-plans` / その他アップストリームスキルを先に呼んでいても、作業を返す直前・commit 直前のタイミングでこのスキルを呼ぶこと。

## 最終チェックリスト

このリストを TodoWrite に展開して 1 項目ずつ確認すること。**該当しない項目は飛ばして良いが、判断は明示する**。

- [ ] `pnpm lint` が通る — まとめて検証したければ ECC 由来の [/quality-gate](../../commands/quality-gate.md) コマンドが lint + 高速テストを順次実行する
- [ ] backend で `meta` / `paramDef` / `res` を変更した → `pnpm build-misskey-js-with-types` を実行して `packages/misskey-js/src/autogen/` の差分も commit に含めた → 詳細手順は [references/tasks/regenerate-misskey-js.md](references/tasks/regenerate-misskey-js.md)
- [ ] エンティティ (`packages/backend/src/models/*.ts` の `@Column` / `@Entity` / `@Index`) を変更した → `pnpm --filter backend check-migrations` が pending DDL 0 件で通る
- [ ] migration ファイルを追加した → `up()` と `down()` の両方を実装した / 既存のマージ済 migration は一切触っていない
- [ ] 新規 `.ts` / `.js` / `.cjs` / `.mjs` / `.vue` / `.scss` / `.html` ファイルを追加した → SPDX ヘッダーを付けた (`.vue` / `.html` は HTML コメント形式、その他は TS コメント形式)
- [ ] `locales/` を編集した → **`ja-JP.yml` だけ** を変更しており、他言語 yml の diff は出ていない (`git diff --name-only develop -- 'locales/*.yml' | grep -v '^locales/ja-JP\.yml$'` が空)
- [ ] ユーザーから見える変更 (機能追加 / 既存挙動変更) → `CHANGELOG.md` の `## Unreleased` 直下の該当サブセクション (General / Client / Server) に 1 行追記した → 詳細書式は [references/tasks/changelog-update.md](references/tasks/changelog-update.md)
- [ ] backend API endpoint を追加・変更した → [misskey-api-reviewer](../../agents/misskey-api-reviewer.md) agent を Task で起動して機械レビューする (endpoint-list 登録漏れ / misskey-js 再生成漏れ / meta・UUID / SPDX。lint や CI では拾いにくい 404・登録漏れの最終関門なので、該当する変更があれば飛ばさない)
- [ ] frontend の `.vue` を追加・変更した → [vue-component-reviewer](../../agents/vue-component-reviewer.md) agent を Task で起動して機械レビューする (SPDX 形式 / 命名 / i18n / SCSS 変数 / os.* / a11y / Storybook 併設)
- [ ] (任意) `.claude/` ハーネス自体の健全性を確認したい → ECC 由来の [/harness-audit](../../commands/harness-audit.md) コマンドを実行

## 何のためのスキルか

これは「**作業中に何を作るか**」を決めるスキルではなく、「**作り終わった後に CI を通す**」スキル。`working-on-backend` / `working-on-frontend` から始まった作業の **出口** として機能する。

該当する変更がある場合は各 references/tasks/ を Read して詳細手順を踏むこと。`pnpm lint` だけは references を読まずに直接走らせて良い (`/quality-gate` でまとめて回せる)。
