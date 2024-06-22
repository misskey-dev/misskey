/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */


export interface IErrPromise<TSuccess, TError = unknown> {
	then<TResult1 = TSuccess, TResult2 = never>(onfulfilled?: ((value: TSuccess) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: TError) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;

	catch<TResult = never>(onrejected?: ((reason: TError) => TResult | PromiseLike<TResult>) | undefined | null): Promise<TSuccess | TResult>;
}

/** rejectに型付けができるPromise */
export class ErrPromise<TSuccess, TError> extends Promise<TSuccess> implements IErrPromise<TSuccess, TError> {
	constructor(executor: (resolve: (value: TSuccess | PromiseLike<TSuccess>) => void, reject: (reason: TError) => void) => void) {
		super(executor);
	}
}
