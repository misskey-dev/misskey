<template>
<FormBase>
	<XQueue :connection="connection" domain="inbox">
		<template #title>In</template>
	</XQueue>
	<XQueue :connection="connection" domain="deliver">
		<template #title>Out</template>
	</XQueue>
	<FormButton @click="clear()" danger><i class="fas fa-trash-alt"></i> {{ $ts.clearQueue }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import MkButton from '@client/components/ui/button.vue';
import XQueue from './queue.chart.vue';
import FormBase from '@client/components/form/base.vue';
import FormButton from '@client/components/form/button.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		FormBase,
		FormButton,
		MkButton,
		XQueue,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.jobQueue,
				icon: 'fas fa-clipboard-list',
			},
			connection: markRaw(os.stream.useChannel('queueStats')),
		}
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);

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
