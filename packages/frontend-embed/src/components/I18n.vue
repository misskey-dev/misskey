<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<render/>
</template>

<script setup lang="ts" generic="T extends string | ParameterizedString">
import { computed, h } from 'vue';
import type { ParameterizedString } from 'i18n';

const props = withDefaults(defineProps<{
	src: T;
	tag?: string;
	// eslint-disable-next-line vue/require-default-prop
	textTag?: string;
}>(), {
	tag: 'span',
});

const slots = defineSlots<T extends ParameterizedString<infer R> ? { [K in R]: () => unknown } : NonNullable<unknown>>();

const parsed = computed(() => {
	let str = props.src as string;
	const value: (string | { arg: string; })[] = [];
	for (; ;) {
		const nextBracketOpen = str.indexOf('{');
		const nextBracketClose = str.indexOf('}');

		if (nextBracketOpen === -1) {
			value.push(str);
			break;
		} else {
			if (nextBracketOpen > 0) value.push(str.substring(0, nextBracketOpen));
			value.push({
				arg: str.substring(nextBracketOpen + 1, nextBracketClose),
			});
		}

		str = str.substring(nextBracketClose + 1);
	}

	return value;
});

const render = () => {
	// slotsの型はTの条件型で決まり文字列インデックスアクセスができないため、
	// frontend側の同名コンポーネント (packages/frontend/src/components/global/I18n.vue) と同じくanyでキャストする
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return h(props.tag, parsed.value.map(x => typeof x === 'string' ? (props.textTag ? h(props.textTag, x) : x) : (slots as any)[x.arg]()));
};
</script>
