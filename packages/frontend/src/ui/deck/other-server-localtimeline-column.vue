<template>
<XColumn :menu="menu" :column="column" :is-stacked="isStacked" @parent-focus="$event => emit('parent-focus', $event)">
	<template #header>
		<i class="ti ti-planet"></i><span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<MkTimeline v-if="column.serverUrl" ref="timeline" src="otherServerLocalTimeline" :server="column.serverUrl" @after="() => emit('loaded')"/>
</XColumn>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import XColumn from './column.vue';
import { updateColumn, Column } from './deck-store';
import MkTimeline from '@/components/MkTimeline.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const emit = defineEmits<{
	(ev: 'loaded'): void;
	(ev: 'parent-focus', direction: 'up' | 'down' | 'left' | 'right'): void;
}>();

let timeline = $shallowRef<InstanceType<typeof MkTimeline>>();

onMounted(() => {
	if (props.column.serverUrl == null) {
		setServer();
	}
});

async function setServer() {
	const { canceled, result: serverUrl } = await os.inputText({
		title: i18n.ts.instance,
		default: props.column.serverUrl,
	});
	if (canceled) return;
	updateColumn(props.column.id, {
		serverUrl: serverUrl,
	});
}

const menu = [{
	icon: 'ti ti-pencil',
	text: i18n.ts.instance,
	action: setServer,
}];

/*
function focus() {
	timeline.focus();
}

defineExpose({
	focus,
});
*/
</script>
