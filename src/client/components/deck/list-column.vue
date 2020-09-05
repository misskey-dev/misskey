<template>
<x-column :menu="menu" :column="column" :is-stacked="isStacked">
	<template #header>
		<fa :icon="faListUl"/><span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<x-timeline v-if="column.listId" ref="timeline" src="list" :list="column.listId" @after="() => $emit('loaded')"/>
</x-column>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faListUl, faCog } from '@fortawesome/free-solid-svg-icons';
import XColumn from './column.vue';
import XTimeline from '../timeline.vue';

export default defineComponent({
	components: {
		XColumn,
		XTimeline,
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
			faListUl
		};
	},

	watch: {
		mediaOnly() {
			(this.$refs.timeline as any).reload();
		}
	},

	created() {
		this.menu = [{
			icon: faCog,
			text: this.$t('selectList'),
			action: this.setList
		}];
	},

	mounted() {
		if (this.column.listId == null) {
			this.setList();
		}
	},

	methods: {
		async setList() {
			const lists = await this.$root.api('users/lists/list');
			const { canceled, result: list } = await this.$store.dispatch('showDialog', {
				title: this.$t('selectList'),
				type: null,
				select: {
					items: lists.map(x => ({
						value: x, text: x.name
					})),
					default: this.column.listId
				},
				showCancelButton: true
			});
			if (canceled) return;
			Vue.set(this.column, 'listId', list.id);
			this.$store.commit('deviceUser/updateDeckColumn', this.column);
		},

		focus() {
			(this.$refs.timeline as any).focus();
		}
	}
});
</script>

<style lang="scss" scoped>
</style>
