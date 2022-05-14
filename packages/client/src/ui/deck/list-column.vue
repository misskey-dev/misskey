<template>
<XColumn :func="{ handler: setList, title: $ts.selectList }" :column="column" :is-stacked="isStacked" @parent-focus="$event => emit('parent-focus', $event)">
	<template #header>
		<i class="fas fa-list-ul"></i><span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<XTimeline v-if="column.listId" ref="timeline" src="list" :list="column.listId" @after="() => emit('loaded')"/>
</XColumn>
</template>

<script lang="ts" setup>
import {  } from 'vue';
import XColumn from './column.vue';
import XTimeline from '@/components/timeline.vue';
import * as os from '@/os';
import { updateColumn, Column } from './deck-store';
import { i18n } from '@/i18n';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const emit = defineEmits<{
	(ev: 'loaded'): void;
	(ev: 'parent-focus', direction: 'up' | 'down' | 'left' | 'right'): void;
}>();

let timeline = $ref<InstanceType<typeof XTimeline>>();

if (props.column.listId == null) {
	setList();
}

async function setList() {
	const lists = await os.api('users/lists/list');
	const { canceled, result: list } = await os.select({
		title: i18n.ts.selectList,
		items: lists.map(x => ({
			value: x, text: x.name
		})),
		default: props.column.listId
	});
	if (canceled) return;
	updateColumn(props.column.id, {
		listId: list.id
	});
}

/*
function focus() {
	timeline.focus();
}

export default defineComponent({
	watch: {
		mediaOnly() {
			(this.$refs.timeline as any).reload();
		}
	}
});
*/
</script>

<style lang="scss" scoped>
</style>
