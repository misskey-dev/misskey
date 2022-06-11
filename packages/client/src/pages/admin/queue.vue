<template>
<MkSpacer :content-max="800">
	<XQueue :connection="connection" domain="inbox">
		<template #title>In</template>
	</XQueue>
	<XQueue :connection="connection" domain="deliver">
		<template #title>Out</template>
	</XQueue>
	<MkButton danger @click="clear()"><i class="fas fa-trash-alt"></i> {{ i18n.ts.clearQueue }}</MkButton>
</MkSpacer>
</template>

<script lang="ts" setup>
import { markRaw, onMounted, onBeforeUnmount, nextTick } from 'vue';
import MkButton from '@/components/ui/button.vue';
import XQueue from './queue.chart.vue';
import * as os from '@/os';
import { stream } from '@/stream';
import * as symbols from '@/symbols';
import * as config from '@/config';
import { i18n } from '@/i18n';

const connection = markRaw(stream.useChannel('queueStats'));

function clear() {
	os.confirm({
		type: 'warning',
		title: i18n.ts.clearQueueConfirmTitle,
		text: i18n.ts.clearQueueConfirmText,
	}).then(({ canceled }) => {
		if (canceled) return;

		os.apiWithDialog('admin/queue/clear');
	});
}

onMounted(() => {
	nextTick(() => {
		connection.send('requestLog', {
			id: Math.random().toString().substr(2, 8),
			length: 200
		});
	});
});

onBeforeUnmount(() => {
	connection.dispose();
});

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.jobQueue,
		icon: 'fas fa-clipboard-list',
		bg: 'var(--bg)',
		actions: [{
			asFullButton: true,
			icon: 'fas fa-up-right-from-square',
			text: i18n.ts.dashboard,
			handler: () => {
				window.open(config.url + '/queue', '_blank');
			},
		}],
	}
});
</script>
