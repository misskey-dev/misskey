/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FIXME = any;

declare const _LANGS_: string[][];
declare const _VERSION_: string;
declare const _ENV_: string;
declare const _DEV_: boolean;
declare const _PERF_PREFIX_: string;

// 仕様にはあるが、対応するブラウザエンジンが2つに満たないため @types/serviceworker から除かれているオプション
// https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/1725
interface NotificationOptions {
	actions?: NotificationAction[];
	renotify?: boolean;
}
