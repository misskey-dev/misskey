/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, onUnmounted, ref, watch } from 'vue';
import { EventEmitter } from 'eventemitter3';
import type { Ref, WritableComputedRef } from 'vue';

// NOTE: 明示的な設定値のひとつとして null もあり得るため、設定が存在しないかどうかを判定する目的で null で比較したり ?? を使ってはいけない

//type DottedToNested<T extends Record<string, any>> = {
//	[K in keyof T as K extends string ? K extends `${infer A}.${infer B}` ? A : K : K]: K extends `${infer A}.${infer B}` ? DottedToNested<{ [key in B]: T[K] }> : T[K];
//};

type StoreEvent<Data extends Record<string, any>> = {
	updated: <K extends keyof Data>(ctx: {
		key: K;
		value: Data[K];
	}) => void;
};

export class Store<Data extends Record<string, any>> extends EventEmitter<StoreEvent<Data>> {
	/**
	 * static / state の略 (static が予約語のため)
	 */
	public s = {} as {
		[K in keyof Data]: Data[K];
	};

	/**
	 * reactive の略
	 */
	public r = {} as {
		[K in keyof Data]: Ref<Data[K]>;
	};

	constructor(data: { [K in keyof Data]: Data[K] }) {
		super();

		for (const key in data) {
			this.s[key] = data[key];
			this.r[key] = ref(this.s[key]);
		}
	}

	public commit<K extends keyof Data>(key: K, value: Data[K]) {
		const v = JSON.parse(JSON.stringify(value)); // deep copy 兼 vueのプロキシ解除
		this.r[key].value = this.s[key] = v;
		this.emit('updated', { key, value: v });
	}

	public rewrite<K extends keyof Data>(key: K, value: Data[K]) {
		const v = JSON.parse(JSON.stringify(value)); // deep copy 兼 vueのプロキシ解除
		this.r[key].value = this.s[key] = v;
	}

	/**
	 * 特定のキーの、簡易的なcomputed refを作ります
	 * 主にvue上で設定コントロールのmodelとして使う用
	 */
	public model<K extends keyof Data, V extends Data[K] = Data[K]>(
		key: K,
		getter?: (v: Data[K]) => V,
		setter?: (v: V) => Data[K],
	): WritableComputedRef<V> {
		const valueRef = ref(this.s[key]);

		const stop = watch(this.r[key], val => {
			valueRef.value = val;
		});

		// NOTE: vueコンポーネント内で呼ばれない限りは、onUnmounted は無意味なのでメモリリークする
		onUnmounted(() => {
			stop();
		});

		// TODO: VueのcustomRef使うと良い感じになるかも
		return computed({
			get: () => {
				if (getter) {
					return getter(valueRef.value);
				} else {
					return valueRef.value;
				}
			},
			set: (value) => {
				const val = setter ? setter(value) : value;
				this.commit(key, val);
				valueRef.value = val;
			},
		});
	}
}
