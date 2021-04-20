<template>
<XColumn v-if="deckStore.state.alwaysShowMainColumn || $route.name !== 'index'" :column="column" :is-stacked="isStacked">
	<template #header>
		<XHeader :info="pageInfo"/>
	</template>

	<router-view v-slot="{ Component }" class="_flat_">
		<transition>
			<keep-alive :include="['timeline']">
				<component :is="Component" :ref="changePage" @contextmenu.stop="onContextmenu"/>
			</keep-alive>
		</transition>
	</router-view>
</XColumn>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faWindowMaximize } from '@fortawesome/free-solid-svg-icons';
import XColumn from './column.vue';
import XNotes from '@client/components/notes.vue';
import XHeader from '@client/ui/_common_/header.vue';
import { deckStore } from '@client/ui/deck/deck-store';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		XColumn,
		XHeader,
		XNotes
	},

	props: {
		column: {
			type: Object,
			required: true
		},
		isStacked: {
			type: Boolean,
			required: true
		}
	},

	data() {
		return {
			deckStore,
			pageInfo: null,
		}
	},

	methods: {
		changePage(page) {
			if (page == null) return;
			if (page[symbols.PAGE_INFO]) {
				this.pageInfo = page[symbols.PAGE_INFO];
			}
		},

		onContextmenu(e) {
			const isLink = (el: HTMLElement) => {
				if (el.tagName === 'A') return true;
				if (el.parentElement) {
					return isLink(el.parentElement);
				}
			};
			if (isLink(e.target)) return;
			if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.attributes['contenteditable']) return;
			if (window.getSelection().toString() !== '') return;
			const path = this.$route.path;
			os.contextMenu([{
				type: 'label',
				text: path,
			}, {
				icon: 'fas fa-window-maximize',
				text: this.$ts.openInWindow,
				action: () => {
					os.pageWindow(path);
				}
			}], e);
		},
	}
});
</script>
