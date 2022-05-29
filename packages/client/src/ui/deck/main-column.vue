<template>
<XColumn v-if="deckStore.state.alwaysShowMainColumn || $route.name !== 'index'" :column="column" :is-stacked="isStacked" @parent-focus="$event => emit('parent-focus', $event)">
	<template #header>
		<template v-if="pageInfo">
			<i :class="pageInfo.icon"></i>
			{{ pageInfo.title }}
		</template>
	</template>

	<MkStickyContainer>
		<template #header><MkHeader v-if="pageInfo && !pageInfo.hideHeader" :info="pageInfo"/></template>
		<router-view v-slot="{ Component }">
			<transition>
				<keep-alive :include="['MkTimelinePage']">
					<component :is="Component" :ref="changePage" @contextmenu.stop="onContextmenu"/>
				</keep-alive>
			</transition>
		</router-view>
	</MkStickyContainer>
</XColumn>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XColumn from './column.vue';
import { deckStore, Column } from '@/ui/deck/deck-store';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';
import { router } from '@/router';

defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const emit = defineEmits<{
	(ev: 'parent-focus', direction: 'up' | 'down' | 'left' | 'right'): void;
}>();

let pageInfo = $ref<Record<string, any> | null>(null);

function changePage(page) {
	if (page == null) return;
	if (page[symbols.PAGE_INFO]) {
		pageInfo = page[symbols.PAGE_INFO];
	}
}
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
	const path = router.currentRoute.value.path;
	os.contextMenu([{
		type: 'label',
		text: path,
	}, {
		icon: 'fas fa-window-maximize',
		text: i18n.ts.openInWindow,
		action: () => {
			os.pageWindow(path);
		}
	}], ev);
}
</script>
