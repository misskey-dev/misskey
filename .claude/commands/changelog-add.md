---
description: CHANGELOG.md の Unreleased セクションに 1 行追記する
argument-hint: <general|client|server> <Prefix>: <description>
allowed-tools: Bash(awk:*), Bash(git diff:*), Read, Edit
---

## 引数

引数: `$ARGUMENTS`

## 現在の Unreleased セクション

!`awk '/^## Unreleased/,/^## [0-9]/' CHANGELOG.md`

## タスク

1. **引数の解析**
   `$ARGUMENTS` を以下の形式として解釈する:
   - 第 1 トークン: scope = `general` / `client` / `server` のいずれか (case-insensitive)
   - 残り: エントリ本文。`Enhance:` / `Fix:` / `Feat:` のいずれかで始まる前提
   - 不正な scope や、Prefix が見当たらない場合はエラー終了し、ユーザーに `argument-hint` の書式を提示する

   scope は次のように見出しに変換する: `general` → `### General` / `client` → `### Client` / `server` → `### Server`。

2. **対象サブセクションの状態判定**
   上の context (現在の Unreleased セクション) を見て、対象サブセクションが以下のどちらかを判定する:
   - **空 (placeholder のみ)**: 見出し直下に `-` 単独行のみがある状態
   - **既存エントリあり**: `- Enhance: ...` / `- Fix: ...` / `- Feat: ...` の行が 1 つ以上ある状態

3. **CHANGELOG.md の編集**
   `Read` で CHANGELOG.md 全体を確認した後、`Edit` ツールで以下のように更新する:

   - **空の場合**: 該当サブセクションの placeholder `-` 行を `- <整形済みエントリ>` で置換する。例: `### General\n-\n` → `### General\n- Enhance: 新しい機能\n`
   - **既存ありの場合**: 既存エントリ群の **末尾** (次の空行直前) に新エントリを **append** する。順序入れ替えはしない。

   `Edit` の `old_string` には、置換対象のサブセクション付近のユニークな文脈 (見出し + 直後の数行) を含め、誤マッチを防ぐ。

4. **不可侵の徹底**
   - `## Unreleased` 以下の対象サブセクションのみ編集する。
   - `## 2026.x.x` 以下の過去リリースセクションは絶対に変更しない ([AGENTS.md §CHANGELOG](../../AGENTS.md#changelog) 参照)。

5. **結果確認**
   `git diff CHANGELOG.md` を実行し、想定通り 1 行のみ追加されていることを表示して、ユーザーに確認させる。

## 例

- `/changelog-add server Fix: 通知が遅延する問題を修正` → `### Server` 末尾に追記
- `/changelog-add client Enhance: ノートの表示を改善` → `### Client` 末尾に追記
- `/changelog-add general Feat: 新機能の追加` → `### General` 末尾に追記 (placeholder 置換)
