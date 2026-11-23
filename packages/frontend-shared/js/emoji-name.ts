/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const colonsRegex = /:/g;
const localHostMarkRegex = /@\./;

/**
 * リアクション文字列から絵文字名を取り出す
 * (例: `:name@.:` → `name`、`:name@host:` → `name@host`、Unicode絵文字はそのまま)
 */
export function getEmojiNameFromReaction(reaction: string): string {
	return reaction.replace(colonsRegex, '').replace(localHostMarkRegex, '');
}

/**
 * カスタム絵文字のname (`:name:` 形式または素の `name`) から、前後のコロンとローカルホストマーク (`@.`) を除いた名前を取り出す
 * (例: `:name@.:` → `name`、`name@host` → `name@host`)
 */
export function normalizeCustomEmojiName(name: string): string {
	return (name[0] === ':' ? name.substring(1, name.length - 1) : name).replace('@.', '');
}

/**
 * ローカル (自ホスト) のカスタム絵文字かどうかを判定する
 * (`name` には `normalizeCustomEmojiName` で正規化した名前を渡すこと。
 * リアクション文字列に対しては `isLocalCustomEmojiReaction` を使うこと)
 */
export function isLocalCustomEmojiName(name: string, host: string | null | undefined): boolean {
	return !host && (name.endsWith('@.') || !name.includes('@'));
}

/**
 * リアクション文字列がローカル (自ホスト) のカスタム絵文字かどうかを判定する
 * (`:name@.:` のようにローカルホストマークを保持している場合のみtrue。Unicode絵文字はfalse)
 */
export function isLocalCustomEmojiReaction(reaction: string): boolean {
	return reaction[0] === ':' && reaction.includes('@.');
}

/**
 * カスタム絵文字の画像パスを組み立てる
 * (例: (`name`, `host`) → `/emoji/name@host.webp`、(`name`, null) → `/emoji/name.webp`)
 */
export function getCustomEmojiImagePath(name: string, host: string | null | undefined): string {
	return host ? `/emoji/${name}@${host}.webp` : `/emoji/${name}.webp`;
}
