# CHANGELOG.md の Unreleased セクションに 1 行追記する

ユーザー影響のある変更 (機能追加・修正・改善) は `CHANGELOG.md` の冒頭 `## Unreleased` セクションに 1 行追加する。リファクタリング等の内部変更は不要。

## セクション構造

`## Unreleased` 配下に **3 つのサブセクション** が用意されている:

- `### General` — 共通 / 横断的な変更
- `### Client` — `packages/frontend` 系
- `### Server` — `packages/backend` 系

## エントリ書式

該当サブセクションに `- <Prefix>: <概要>` の形式で追加。Prefix は先頭大文字。

```text
- Enhance: ノートの詳細表示での公開範囲の表示を改善
- Fix: 通知が約10秒遅延する問題を修正
- Feat: 新機能の追加
```

| Prefix | 用途 |
|---|---|
| `Feat:` | 新機能の追加 |
| `Enhance:` | 既存機能の改善 |
| `Fix:` | バグ修正 |

## 触ってはいけない範囲

- `## Unreleased` **以外** のセクション (過去リリース) は変更しない
- `## Unreleased` の見出しと 3 つの空サブセクション骨格自体は維持する (リリーススクリプトが期待する構造)

## 作業手順 (手で書く場合)

1. `CHANGELOG.md` を開いて `## Unreleased` セクションを探す
2. 対象サブセクション (`### General` / `### Client` / `### Server`) の状態を確認
   - **空 (placeholder のみ)**: 見出し直下に `-` 単独行のみがある → これを `- Feat: ...` 等で **置換**
   - **既存エントリあり**: `- Enhance: ...` / `- Fix: ...` 等の行が 1 つ以上ある → 既存エントリ群の **末尾** に **追記**
3. 順序入れ替えはしない (差分レビューしやすさのため)
4. `git diff CHANGELOG.md` で 1 行のみ追加されていることを確認

## 例

| 引数イメージ | 結果 |
|---|---|
| server, `Fix: 通知が遅延する問題を修正` | `### Server` 末尾に `- Fix: 通知が遅延する問題を修正` を追記 |
| client, `Enhance: ノートの表示を改善` | `### Client` 末尾に `- Enhance: ノートの表示を改善` を追記 |
| general, `Feat: 新機能の追加` | `### General` の placeholder `-` を `- Feat: 新機能の追加` で置換 |

## コミットメッセージ書式との違い

CHANGELOG とコミットメッセージは **書式が異なる**:

- CHANGELOG: `- Enhance: ノートの表示を改善` (先頭大文字の英語 Prefix + コロン + 日本語本文)
- コミットメッセージ: `enhance(frontend): improve note display` (小文字 + スコープ + コロン + 英語本文。詳細は [CONTRIBUTING.md](../../../../../CONTRIBUTING.md))

両方を 1 つの PR で更新するときに混同しないこと。
