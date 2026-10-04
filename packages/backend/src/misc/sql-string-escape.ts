/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * 文字列をSQLの文字列リテラル (単引用符で囲まれた形) にエスケープする。
 *
 * `standard_conforming_strings` が有効 (PostgreSQL 9.1 以降の既定) な前提で、
 * 単引用符リテラル内で特別扱いされる文字は単引用符のみなのでそれを二重化する。
 *
 * なお配列リテラル (`'{...}'`) の中はさらに独自のエスケープ規則を持つので、
 * 配列を作る場合はこの関数の結果を `ARRAY[...]` コンストラクタに渡すこと。
 */
export function sqlStringEscape(value: string): string {
	return `'${value.replaceAll("'", "''")}'`;
}
