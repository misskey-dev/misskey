/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as Misskey from 'misskey-js';

const providedContextEl = document.getElementById('misskey_embedCtx');

export type ServerContext = {
	clip?: Misskey.entities.Clip;
	note?: Misskey.entities.Note;
	user?: Misskey.entities.UserLite;
} | null;

// NOTE: devモードのときしか embedCtx が null になることは無い
export const serverContext: ServerContext = (providedContextEl && providedContextEl.textContent) ? JSON.parse(providedContextEl.textContent) : null;

export function assertServerContext<K extends keyof NonNullable<ServerContext>>(ctx: ServerContext, entity: K): ctx is Required<Pick<NonNullable<ServerContext>, K>> {
	if (ctx == null) return false;
	return entity in ctx;
}
