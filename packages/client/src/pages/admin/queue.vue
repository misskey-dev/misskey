<template>
<MkSpacer :content-max="800">
	<XQueue :connection="connection" domain="inbox">
		<template #title>In</template>
	</XQueue>
	<XQueue :connection="connection" domain="deliver">
		<template #title>Out</template>
	</XQueue>
	<MkButton danger @click="clear()"><i class="fas fa-trash-alt"></i> {{ $ts.clearQueue }}</MkButton>
</MkSpacer>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import MkButton from '@/components/ui/button.vue';
import XQueue from './queue.chart.vue';
import * as os from '@/os';
import { stream } from '@/stream';
import * as symbols from '@/symbols';
import * as config from '@/config';

export default defineComponent({
	components: {
		MkButton,
		XQueue,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.jobQueue,
				icon: 'fas fa-clipboard-list',
				bg: 'var(--bg)',
				actions: [{
					asFullButton: true,
					icon: 'fas fa-up-right-from-square',
					text: this.$ts.dashboard,
					handler: () => {
						window.open(config.url + '/queue', '_blank');
					},
				}],
			},
			connection: markRaw(stream.useChannel('queueStats')),
		}
	},

	mounted() {
		this.$nextTick(() => {
			this.connection.send('requestLog', {
				id: Math.random().toString().substr(2, 8),
				length: 200
			});
		});
	},

	beforeUnmount() {
		this.connection.dispose();
	},

	methods: {
		clear() {
			os.confirm({
				type: 'warning',
				title: this.$ts.clearQueueConfirmTitle,
				text: this.$ts.clearQueueConfirmText,
			}).then(({ canceled }) => {
				if (canceled) return;

				os.apiWithDialog('admin/queue/clear', {});
			});
		}
	}
});
</script>
