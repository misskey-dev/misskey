/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as Misskey from 'misskey-js';
import { $i } from '@/account.js';

const providedContextEl = document.getElementById('misskey_clientCtx');

export type ServerContext = {
	clip?: Misskey.entities.Clip;
	note?: Misskey.entities.Note;
	user?: Misskey.entities.UserLite;
} | null;

export const serverContext: ServerContext = (providedContextEl && providedContextEl.textContent) ? JSON.parse(providedContextEl.textContent) : null;

export function getServerContext<K extends keyof NonNullable<ServerContext>>(entity: K): Required<Pick<NonNullable<ServerContext>, K>> | null {
	// contextは非ログイン状態の情報しかないためログイン時は利用できない
	if ($i) return null;

	return serverContext ? (serverContext[entity] ?? null) : null;
}
