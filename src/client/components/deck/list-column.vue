<template>
<x-column :menu="menu" :column="column" :is-stacked="isStacked">
	<template #header>
		<fa :icon="faListUl"/><span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<x-timeline ref="timeline" src="list" :list="{ id: column.listId }" @after="() => $emit('loaded')"/>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import { faListUl } from '@fortawesome/free-solid-svg-icons';
import XColumn from './column.vue';
import XTimeline from '../timeline.vue';

export default Vue.extend({
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
			icon: 'cog',
			text: this.$t('list'),
			action: async () => {
				const lists = await this.$root.api('users/lists/list');
				this.$root.dialog({
					title: this.$t('list'),
					type: null,
					select: {
						items: lists.map(x => ({
							value: x, text: x.name
						}))
					},
					showCancelButton: true
				}).then(({ canceled, result: list }) => {
					if (canceled) return;
					this.column.listId = list.id;
					this.$store.commit('deviceUser/updateDeckColumn', this.column);
				});
			}
		}];
	},

	methods: {
		focus() {
			(this.$refs.timeline as any).focus();
		}
	}
});
</script>

<style lang="scss" scoped>
</style>
