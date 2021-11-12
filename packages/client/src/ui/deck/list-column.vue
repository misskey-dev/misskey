<template>
<XColumn :func="{ handler: setList, title: $ts.selectList }" :column="column" :is-stacked="isStacked">
	<template #header>
		<i class="fas fa-list-ul"></i><span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<XTimeline v-if="column.listId" ref="timeline" src="list" :list="column.listId" @after="() => $emit('loaded')"/>
</XColumn>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XColumn from './column.vue';
import XTimeline from '@/components/timeline.vue';
import * as os from '@/os';
import { updateColumn } from './deck-store';

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
		};
	},

	watch: {
		mediaOnly() {
			(this.$refs.timeline as any).reload();
		}
	},

	mounted() {
		if (this.column.listId == null) {
			this.setList();
		}
	},

	methods: {
		async setList() {
			const lists = await os.api('users/lists/list');
			const { canceled, result: list } = await os.dialog({
				title: this.$ts.selectList,
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
			updateColumn(this.column.id, {
				listId: list.id
			});
		},

		focus() {
			(this.$refs.timeline as any).focus();
		}
	}
});
</script>

<style lang="scss" scoped>
</style>
