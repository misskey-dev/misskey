# `.claude/commands/` — プロジェクト固有のスラッシュコマンド

Misskey 開発で繰り返し使うワークフローを `/command-name` で呼び出せるよう、`.claude/commands/<name>.md` 形式で配置している。

## 実装済みコマンド

### Misskey オリジナル

| コマンド | 用途 | 典型ユースケース |
| --- | --- | --- |
| [`/check-misskey-js`](./check-misskey-js.md) | `pnpm build-misskey-js-with-types` を走らせ、`packages/misskey-js/src/autogen/` の差分を報告 | backend の API endpoint を追加・変更した直後 |
| [`/changelog-add`](./changelog-add.md) | `CHANGELOG.md` の `## Unreleased` 配下、対応するサブセクションに 1 行追記 | ユーザー影響のある変更をコミットする直前 |
| [`/migrate-new`](./migrate-new.md) | TypeORM `migration:create` の薄いラッパー (拡張子変換 + SPDX 付与 + `check-migrations` で pending DDL 検出) | 手書き SQL / データ移行用に空雛形が欲しい時 |

### ECC ([everything-claude-code](https://github.com/affaan-m/everything-claude-code)) 由来 (MIT)

ECC の MIT ライセンスファイルを Misskey の規約に合わせて再構成したもの。出典は [.claude/THIRD_PARTY_LICENSES.md](../THIRD_PARTY_LICENSES.md) を参照。

| コマンド | 用途 | 典型ユースケース |
| --- | --- | --- |
| [`/quality-gate`](./quality-gate.md) | `pnpm lint` + 各パッケージの unit test を順次実行する軽量品質ゲート | 完了前の軽量チェック (重い E2E は CI 側に委譲) |
| [`/harness-audit`](./harness-audit.md) | `.claude/` ハーネスを 7 カテゴリで採点し改善優先度を提示 | 設定の点検 / 新しい skill / agent / hook を入れた後 |

## 使い分け

- **`/migrate-new` vs [`create-migration` skill](../skills/create-migration/SKILL.md)**:
  - 雛形だけ素早く欲しい → `/migrate-new`
  - エンティティ差分から自動生成、または CONCURRENTLY などの注意点を含めて完全に誘導してほしい → `create-migration` skill (`migration:generate`)
- **`/changelog-add` vs 手動編集**:
  - サブセクションの placeholder `-` 置換や、過去リリースセクションへの誤編集を避けるため、原則コマンドを使う。
- **`/quality-gate` のスコープ**:
  - 編集途中の軽量チェック (lint + unit test) は `/quality-gate` で十分。重い e2e / federation / Cypress は CI 側で実行されるため、ローカルでは原則回さない。

## 新規追加時の方針

- 既存の `superpowers` / `pr-review-toolkit` などのプラグイン提供スラッシュコマンドで足りる場合は新規追加しない。
- frontmatter には最低限 `description` を指定し、引数を取るなら `argument-hint`、可能なら `allowed-tools` も指定する (permission prompt を最小化するため)。
- 長時間ビルド (2 分超) を伴うコマンドはインライン `` !`<cmd>` `` を使わず、本文で `Bash` ツール呼び出し時の `timeout` を指示する。
