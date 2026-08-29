/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';

export type OperationMemoToken<K, V> = Readonly<{
	id: symbol;
	getCacheKey: (key: K) => PropertyKey;
	_valueType?: V;
}>;

/**
 * Operation内memoの名前空間とキーの作り方を定義する。
 *
 * 同じtokenを使った呼び出しだけが値を共有するため、tokenは呼び出しごとではなく
 * module scopeなどで一度だけ定義する。symbolにより、別の利用箇所との名前衝突を防ぐ。
 */
export function defineOperationMemo<K, V>(
	name: string,
	getCacheKey: (key: K) => PropertyKey,
): OperationMemoToken<K, V> {
	return {
		id: Symbol(name),
		getCacheKey,
	};
}

/**
 * 1つのOperationが所有するmemo。インスタンスはrunRoot()ごとに新しく作られる。
 */
class OperationContext {
	private readonly memo = new Map<symbol, Map<PropertyKey, Promise<unknown>>>();

	public memoize<K, V>(
		token: OperationMemoToken<K, V>,
		key: K,
		loader: () => V | PromiseLike<V>,
	): Promise<V> {
		let entries = this.memo.get(token.id);
		if (entries == null) {
			entries = new Map();
			this.memo.set(token.id, entries);
		}

		const cacheKey = token.getCacheKey(key);
		const cached = entries.get(cacheKey);
		if (cached != null) return cached as Promise<V>;

		const value = Promise.resolve().then(loader);
		entries.set(cacheKey, value);
		return value;
	}

	public invalidate<K, V>(
		token: OperationMemoToken<K, V>,
		key: K,
	): void {
		this.memo.get(token.id)?.delete(token.getCacheKey(key));
	}

	public invalidateAll<K, V>(
		token: OperationMemoToken<K, V>,
	): void {
		this.memo.delete(token.id);
	}
}

/**
 * 1回の短命なAPIリクエストやQueueジョブ内だけで値を共有する。
 * Redisやプロセス内キャッシュとは異なり、Operationの境界を越えて値を共有しない。
 *
 * Contextの分離:
 * `runRoot()`は呼び出しごとに新しいOperationContextを作成し、AsyncLocalStorageを介して
 * Node.jsが内部で管理するasync execution chainへ関連付ける。`getStore()`は現在実行中の
 * chainに対応するContextを返すため、リクエストIDのようなキーを明示的に管理する必要はない。
 * 並行するrunRoot()はそれぞれ異なるContextを参照し、値を共有しない。
 * この分離は、各APIリクエストやQueueジョブの入口でrunRoot()を呼ぶことを前提とする。
 *
 * Contextの伝播:
 * runRoot()のcallback内で開始した通常のPromise/await、timer、I/O callbackには
 * 同じContextが伝播する。runRoot()をネストした場合は新しいContextへ切り替わり、
 * 内側を抜けると親のContextへ戻る。
 *
 * Operation境界:
 * Contextが伝播するのは同一Node.jsプロセスのasync chain内だけであり、別プロセス、
 * Worker、Redis、Queueへserializeした処理には伝播しない。伝播しない処理では、
 * それぞれの入口で新しいrunRoot()を呼ぶ。
 *
 * ライフサイクル:
 * Contextを参照するasync resourceが解放されるとGC対象になる。callback内で開始した
 * fire-and-forgetの処理は、ContextとmemoをOperation終了後も保持し得るため、
 * Operationに属する処理はすべてawaitし、短命な処理だけを対象とする。
 *
 * 制約:
 * これは認可やデータアクセスを隔離するsecurity boundaryではない。値の参照を明示的に
 * 外へ渡せば共有できるため、Operation間で値を持ち出さないことは呼び出し側の責務となる。
 */
@Injectable()
export class OperationContextService {
	private readonly storage = new AsyncLocalStorage<OperationContext>();

	/**
	 * 新しいOperationを開始する。既にOperation内であっても、親とは別のContextを作成する。
	 * callback内で作られたasync chainでは、明示的に引数を渡さず同じContextを参照できる。
	 *
	 * memoにはTTLがないため、APIリクエストなどの短時間で完了する処理だけを対象とする。
	 * バッチやインポートなど、長時間・大量のキーを扱う処理全体を囲んではならない。
	 */
	@bindThis
	public runRoot<T>(
		callback: () => T,
	): T {
		return this.storage.run(new OperationContext(), callback);
	}

	/**
	 * Operation内では同じtoken/keyのloaderを1回だけ実行する。
	 * 実行中のPromise自体を保持するため、同時呼び出しも1つに束ねられる。
	 * rejectionもinvalidateされるまで同じOperation内で保持される。
	 *
	 * 境界が未導入の処理ではキャッシュせず、loaderを通常どおり実行する。
	 */
	@bindThis
	public memoizeIfActive<K, V>(
		token: OperationMemoToken<K, V>,
		key: K,
		loader: () => V | PromiseLike<V>,
	): Promise<V> {
		const context = this.storage.getStore();
		if (context == null) return Promise.resolve().then(loader);

		return context.memoize(token, key, loader);
	}

	/**
	 * 同一Operation内の指定token/keyを破棄する。書き込み後のread-your-own-writeに使用する。
	 */
	@bindThis
	public invalidateIfActive<K, V>(
		token: OperationMemoToken<K, V>,
		key: K,
	): void {
		this.storage.getStore()?.invalidate(token, key);
	}

	/**
	 * 同一Operation内の指定tokenに紐づく全エントリを破棄する。
	 */
	@bindThis
	public invalidateAllIfActive<K, V>(
		token: OperationMemoToken<K, V>,
	): void {
		this.storage.getStore()?.invalidateAll(token);
	}
}
