<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :style="`height: ${widgetProps.height}px;`" :showHeader="widgetProps.showHeader" :scrollable="true" data-testid="mkw-favorites" class="mkw-favorites">
	<template #icon><i class="ti ti-star"></i></template>
	<template #header>{{ i18n.ts._widgets.favorites }}</template>

	<MkPagination :paginator="paginator">
		<template #empty><MkResult type="empty" :text="i18n.ts.noNotes"/></template>

		<template #default="{ items }">
			<div class="_gaps">
				<MkNote v-for="item in items" :key="item.id" :note="item.note" :class="$style.note"/>
			</div>
		</template>
	</MkPagination>
</MkContainer>
</template>

<script lang="ts" setup>
import { markRaw } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import MkContainer from '@/components/MkContainer.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkNote from '@/components/MkNote.vue';
import { i18n } from '@/i18n.js';
import { Paginator } from '@/utility/paginator.js';
import { useGlobalEvent } from '@/events.js';

const name = 'favorites';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		label: i18n.ts._widgetOptions.showHeader,
		default: true,
	},
	height: {
		type: 'number',
		label: i18n.ts.height,
		default: 300,
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const paginator = markRaw(new Paginator('i/favorites', {
	limit: 10,
}));

// i/favorites はストリーミングで更新が届かないため、
// 同じクライアントでのお気に入り登録・解除を検知して再取得する
useGlobalEvent('noteFavorited', () => {
	paginator.reload();
});
useGlobalEvent('noteUnfavorited', () => {
	paginator.reload();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.note {
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
}
</style>
