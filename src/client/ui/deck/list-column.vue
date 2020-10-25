<template>
<XColumn :menu="menu" :column="column" :is-stacked="isStacked">
	<template #header>
		<Fa :icon="faListUl"/><span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<XTimeline v-if="column.listId" ref="timeline" src="list" :list="column.listId" @after="() => $emit('loaded')"/>
</XColumn>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faListUl, faCog } from '@fortawesome/free-solid-svg-icons';
import XColumn from './column.vue';
import XTimeline from '@/components/timeline.vue';
import * as os from '@/os';

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
			const lists = await os.api('users/lists/list');
			const { canceled, result: list } = await os.dialog({
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
			this.column.listId = list.id;
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
