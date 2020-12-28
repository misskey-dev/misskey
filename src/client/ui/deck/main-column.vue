<template>
<XColumn v-if="deckStore.state.alwaysShowMainColumn || $route.name !== 'index'" :column="column" :is-stacked="isStacked">
	<template #header>
		<XHeader :info="pageInfo"/>
	</template>

	<router-view v-slot="{ Component }">
		<transition>
			<keep-alive :include="['timeline']">
				<component :is="Component" :ref="changePage"/>
			</keep-alive>
		</transition>
	</router-view>
</XColumn>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XColumn from './column.vue';
import XNotes from '@/components/notes.vue';
import XHeader from '@/ui/_common_/header.vue';
import { deckStore } from '@/ui/deck/deck-store';

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
			pageKey: 0,
		}
	},

	methods: {
		changePage(page) {
			if (page == null) return;
			if (page.INFO) {
				this.pageInfo = page.INFO;
			}
		},
	}
});
</script>
