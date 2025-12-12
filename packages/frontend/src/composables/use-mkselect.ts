/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MaybeRefOrGetter, Ref } from 'vue';
import { ref } from 'vue';
import type { GetMkSelectValueTypesFromDef, MkSelectItem, OptionValue } from '@/components/MkSelect.vue';

type UnwrapReadonlyItems<T> = T extends readonly (infer U)[] ? U[] : T;

/** 指定したオプション定義をもとに型を狭めたrefを生成するコンポーサブル */
export function useMkSelect<
	const TItemsInput extends MaybeRefOrGetter<MkSelectItem[]>,
	const TItems extends TItemsInput extends MaybeRefOrGetter<infer U> ? U : never,
	// biome-ignore lint/suspicious/noConfusingVoidType: option value can be omitted and in that case void is used
	TInitialValue extends OptionValue | void = void,
	TItemsValue = GetMkSelectValueTypesFromDef<UnwrapReadonlyItems<TItems>>,
	ModelType = TInitialValue extends void
		? TItemsValue
		: (TItemsValue | TInitialValue)
>(opts: {
	items: TItemsInput;
	initialValue?: (TInitialValue | (OptionValue extends TItemsValue ? OptionValue : TInitialValue)) & (
		TItemsValue extends TInitialValue
			? unknown
			: { 'Error: Type of initialValue must include all types of items': TItemsValue }
	);
}): {
	def: TItemsInput;
	model: Ref<ModelType>;
} {
	const model = ref(opts.initialValue ?? null);

	return {
		def: opts.items,
		model: model as Ref<ModelType>,
	};
}
