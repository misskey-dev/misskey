<template>
<div>
	<XQueue :connection="connection" domain="inbox">
		<template #title><Fa :icon="faExchangeAlt"/> In</template>
	</XQueue>
	<XQueue :connection="connection" domain="deliver">
		<template #title><Fa :icon="faExchangeAlt"/> Out</template>
	</XQueue>
	<section class="_section">
		<div class="_content">
			<MkButton @click="clear()"><Fa :icon="faTrashAlt"/> {{ $ts.clearQueue }}</MkButton>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import MkButton from '@/components/ui/button.vue';
import XQueue from './queue.chart.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton,
		XQueue,
	},

	data() {
		return {
			INFO: {
				title: this.$ts.jobQueue,
				icon: faExchangeAlt,
			},
			connection: os.stream.useSharedConnection('queueStats'),
			faExchangeAlt, faTrashAlt
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
			os.dialog({
				type: 'warning',
				title: this.$ts.clearQueueConfirmTitle,
				text: this.$ts.clearQueueConfirmText,
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;

				os.apiWithDialog('admin/queue/clear', {});
			});
		}
	}
});
</script>
