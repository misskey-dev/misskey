<template>
<XColumn v-if="deckStore.state.alwaysShowMainColumn || mainRouter.currentRoute.value.name !== 'index'" :column="column" :is-stacked="isStacked" @parent-focus="$event => emit('parent-focus', $event)">
	<template #header>
		<template v-if="pageMetadata?.value">
			<i :class="pageMetadata?.value.icon"></i>
			{{ pageMetadata?.value.title }}
		</template>
	</template>

	<RouterView @contextmenu.stop="onContextmenu"/>
</XColumn>
</template>

<script lang="ts" setup>
import { ComputedRef, provide } from 'vue';
import XColumn from './column.vue';
import { deckStore, Column } from '@/ui/deck/deck-store';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { mainRouter } from '@/router';
import { PageMetadata, provideMetadataReceiver, setPageMetadata } from '@/scripts/page-metadata';

defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const emit = defineEmits<{
	(ev: 'parent-focus', direction: 'up' | 'down' | 'left' | 'right'): void;
}>();

let pageMetadata = $ref<null | ComputedRef<PageMetadata>>();

provide('router', mainRouter);
provideMetadataReceiver((info) => {
	pageMetadata = info;
});

/*
function back() {
	history.back();
}
*/
function onContextmenu(ev: MouseEvent) {
	if (!ev.target) return;

	const isLink = (el: HTMLElement) => {
		if (el.tagName === 'A') return true;
		if (el.parentElement) {
			return isLink(el.parentElement);
		}
	};
	if (isLink(ev.target as HTMLElement)) return;
	if (['INPUT', 'TEXTAREA', 'IMG', 'VIDEO', 'CANVAS'].includes((ev.target as HTMLElement).tagName) || (ev.target as HTMLElement).attributes['contenteditable']) return;
	if (window.getSelection()?.toString() !== '') return;
	const path = mainRouter.currentRoute.value.path;
	os.contextMenu([{
		type: 'label',
		text: path,
	}, {
		icon: 'fas fa-window-maximize',
		text: i18n.ts.openInWindow,
		action: () => {
			os.pageWindow(path);
		},
	}], ev);
}
</script>
