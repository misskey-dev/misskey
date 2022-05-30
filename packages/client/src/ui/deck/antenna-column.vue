<template>
<XColumn :func="{ handler: setAntenna, title: $ts.selectAntenna }" :column="column" :is-stacked="isStacked" @parent-focus="$event => emit('parent-focus', $event)">
	<template #header>
		<i class="fas fa-satellite"></i><span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<XTimeline v-if="column.antennaId" ref="timeline" src="antenna" :antenna="column.antennaId" @after="() => emit('loaded')"/>
</XColumn>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
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

onMounted(() => {
	if (props.column.antennaId == null) {
		setAntenna();
	}
});

async function setAntenna() {
	const antennas = await os.api('antennas/list');
	const { canceled, result: antenna } = await os.select({
		title: i18n.ts.selectAntenna,
		items: antennas.map(x => ({
			value: x, text: x.name
		})),
		default: props.column.antennaId
	});
	if (canceled) return;
	updateColumn(props.column.id, {
		antennaId: antenna.id
	});
}
/*
function focus() {
	timeline.focus();
}

defineExpose({
	focus,
});
*/
</script>

<style lang="scss" scoped>
</style>
