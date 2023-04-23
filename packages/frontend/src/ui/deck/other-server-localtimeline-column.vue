<template>
<XColumn :menu="menu" :column="column" :is-stacked="isStacked" @parent-focus="$event => emit('parent-focus', $event)">
	<template #header>
		<i class="ti ti-planet"></i><span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<MkTimeline 
		v-if="isInitialized" 
		ref="timeline" 
		src="otherServerLocalTimeline" 
		:server="column.serverUrl" 
		:emojis="emojis"
		:meta="meta"
		@after="() => emit('loaded')"
	/>
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
let emojis = $ref([]);
let meta = $ref({});
let isInitialized = $ref(false);

onMounted(() => {
	if (props.column.serverUrl == null) {
		setServer();
	} else {
		updateInfos(props.column.serverUrl);
	}
});

async function updateInfos(serverUrl:string) : Promise<void> {
	let serverDomain = '';
	let protocol = 'https';
	if (serverUrl.indexOf('://') !== -1) {
		const split = serverUrl.split('://');
		protocol = split[0];
		const domain = split[1].split('/')[0];
		serverDomain = domain;
	} else {
		serverDomain = `${serverUrl.split('/')[0]}`;
	}

	let endpoint = `${protocol}://${serverDomain}/api`;
	let emoji = await os.api(`${endpoint}/emojis`, {});
	emojis = emoji.emojis;
	meta = await os.api(`${endpoint}/meta`, {});

	isInitialized = true;
}

async function setServer() : Promise<void> {
	const { canceled, result: serverUrl } = await os.inputText({
		title: i18n.ts.instance,
		default: props.column.serverUrl,
	});
	if (canceled) return;
	updateColumn(props.column.id, {
		serverUrl: serverUrl,
	});
	updateInfos(serverUrl);
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
