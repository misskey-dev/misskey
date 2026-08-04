---
name: shipping-misskey-change
description: Use at every finish moment of a Misskey change, before committing, opening a PR, merging, or handing work back. Selects proportional validation, runs changed-file lint and repository safety checks, and records PASS/FAIL/BASELINE/SKIPPED without chasing unrelated failures.
---

# shipping-misskey-change

Misskey の変更を commit / PR / merge する直前、または未commitでユーザーへ返す直前の出口。規範は [AGENTS.md](../../../AGENTS.md)、ここでは実行方法だけを定める。

## 1. 検証レベル

| 段 | 条件 | 実行 |
| --- | --- | --- |
| 1 (必須) | package の ESLint 対象ファイルを変更 | 存在する変更ファイルへ `eslint --quiet` を最後に 1 回 |
| 2 | 実装・挙動を変更 | 最も近い unit test。型・生成物・DB に関係するときは対応する専用検証も実行 |
| 3 (任意) | 明示依頼、広域変更、切り分けに必要 | package / repo 全体の lint、build、広域 test |

段 1 は docs-only など対象が空なら `SKIPPED`。段 3 の既存失敗は成功扱いせず `BASELINE` として、今回の変更との関係だけを報告する。

### 変更ファイル lint

次の block を repo root の Bash で実行する。`MISSKEY_BASE_REF` を指定した場合はその ref、未指定なら HEAD に最も近い統合先を使う。ref を解決できなければ exit 2 で止まり、空の差分を成功扱いしない。

```bash
set -euo pipefail

if [[ -n ${MISSKEY_BASE_REF:-} ]]; then
	MISSKEY_BASE=$(git merge-base "$MISSKEY_BASE_REF" HEAD 2>/dev/null) || { echo "invalid MISSKEY_BASE_REF: $MISSKEY_BASE_REF" >&2; exit 2; }
else
	MISSKEY_BASE=
	MISSKEY_DISTANCE=
	for MISSKEY_REF in origin/develop develop origin/master master; do
		MISSKEY_CANDIDATE=$(git merge-base "$MISSKEY_REF" HEAD 2>/dev/null) || continue
		MISSKEY_CANDIDATE_DISTANCE=$(git rev-list --count "$MISSKEY_CANDIDATE"..HEAD) || exit 2
		if [[ -z $MISSKEY_DISTANCE || $MISSKEY_CANDIDATE_DISTANCE -lt $MISSKEY_DISTANCE ]]; then
			MISSKEY_BASE=$MISSKEY_CANDIDATE
			MISSKEY_DISTANCE=$MISSKEY_CANDIDATE_DISTANCE
		fi
	done
	[[ -n $MISSKEY_BASE ]] || { echo 'merge-base not found; set MISSKEY_BASE_REF' >&2; exit 2; }
fi

MISSKEY_CHANGED_FILE=$(mktemp)
trap 'rm -f "$MISSKEY_CHANGED_FILE"' EXIT
git diff --name-only -z "$MISSKEY_BASE"...HEAD > "$MISSKEY_CHANGED_FILE" || exit 2
git diff --name-only -z HEAD >> "$MISSKEY_CHANGED_FILE" || exit 2
git ls-files --others --exclude-standard -z >> "$MISSKEY_CHANGED_FILE" || exit 2
sort -zu "$MISSKEY_CHANGED_FILE" -o "$MISSKEY_CHANGED_FILE" || exit 2
mapfile -d '' -t MISSKEY_CHANGED < "$MISSKEY_CHANGED_FILE"

MISSKEY_LINT_RAN=0
lint_changed_in() {
	local package_root=$1 path_pattern=$2
	local files=() file
	for file in "${MISSKEY_CHANGED[@]}"; do
		[[ -f $file && $file =~ $path_pattern ]] || continue
		files+=("${file#"$package_root"/}")
	done
	((${#files[@]} == 0)) && return 0
	MISSKEY_LINT_RAN=1
	(cd "$package_root" && pnpm exec eslint --quiet -- "${files[@]}")
}

lint_changed_in packages/backend '^packages/backend/(src|test-federation)/.*\.ts$'
lint_changed_in packages/frontend '^packages/frontend/src/.*\.(ts|vue)$'
lint_changed_in packages/frontend-embed '^packages/frontend-embed/src/.*\.(ts|vue)$'
lint_changed_in packages/icons-subsetter '^packages/icons-subsetter/src/.*\.ts$'
lint_changed_in packages/sw '^packages/sw/src/.*\.ts$'
for MISSKEY_PACKAGE in frontend-shared frontend-builder i18n misskey-js misskey-bubble-game misskey-reversi; do
	lint_changed_in "packages/$MISSKEY_PACKAGE" "^packages/$MISSKEY_PACKAGE/.*\\.(js|jsx|ts|tsx)$"
done
for MISSKEY_PACKAGE in changelog-checker diagnostics-backend diagnostics-frontend diagnostics-shared; do
	lint_changed_in "packages-private/$MISSKEY_PACKAGE" "^packages-private/$MISSKEY_PACKAGE/.*\\.(js|jsx|ts|tsx)$"
done
((MISSKEY_LINT_RAN == 1)) || echo 'Lint: SKIPPED (対象ファイルなし)'
```

## 2. 変更別チェック

- backend API の `meta` / `paramDef` / `res`: `pnpm build-misskey-js-with-types`。手順は [regenerate-misskey-js.md](references/tasks/regenerate-misskey-js.md)
- entity / migration: `pnpm --filter backend check-migrations`。新規 migration は `up()` / `down()`、既存のマージ済 migration は差分なし
- backend API endpoint: [misskey-api-reviewer](../../agents/misskey-api-reviewer.md) を実行
- frontend `.vue`: [vue-component-reviewer](../../agents/vue-component-reviewer.md) を実行

### Repository safety

段 1 と同じ Bash session で続けて実行する。

```bash
MISSKEY_SPDX_STATUS=0
node scripts/check-spdx.mjs || MISSKEY_SPDX_STATUS=$?

MISSKEY_LOCALE_STATUS=0
MISSKEY_BAD_LOCALES=()
for file in "${MISSKEY_CHANGED[@]}"; do
	[[ $file == locales/*.yml && $file != locales/ja-JP.yml ]] && MISSKEY_BAD_LOCALES+=("$file")
done
if ((${#MISSKEY_BAD_LOCALES[@]} > 0)); then
	printf 'forbidden locale change: %s\n' "${MISSKEY_BAD_LOCALES[@]}" >&2
	MISSKEY_LOCALE_STATUS=1
fi

if ((MISSKEY_SPDX_STATUS != 0)); then
	exit "$MISSKEY_SPDX_STATUS"
fi
((MISSKEY_LOCALE_STATUS == 0)) || exit "$MISSKEY_LOCALE_STATUS"
```

SPDX 欠落時だけ同 script の `--fix` を実行し、通常検査を再実行する。`SPDX: OK` 後は追加確認しない。その他の常設方針は AGENTS.md に従う。

## 3. 引き継ぎ

実行項目を `PASS / FAIL / BASELINE / SKIPPED` で短く列挙する。失敗時は今回の変更との関係、未実行時は理由を書く。ユーザーが依頼していない commit / PR / 外部送信は行わない。
