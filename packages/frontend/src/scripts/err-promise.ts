/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** rejectに型付けができるPromise */
export class ErrPromise<TSuccess, TError> extends Promise<TSuccess> {
	constructor(executor: (resolve: (value: TSuccess | PromiseLike<TSuccess>) => void, reject: (reason: TError) => void) => void) {
		super(executor);
	}
}
