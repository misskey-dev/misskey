<template>
<div>
	<portal to="icon"><fa :icon="faExchangeAlt"/></portal>
	<portal to="title">{{ $t('jobQueue') }}</portal>

	<x-queue :connection="connection" domain="inbox">
		<template #title><fa :icon="faExchangeAlt"/> In</template>
	</x-queue>
	<x-queue :connection="connection" domain="deliver">
		<template #title><fa :icon="faExchangeAlt"/> Out</template>
	</x-queue>
	<section class="_card">
		<div class="_content">
			<mk-button @click="clear()"><fa :icon="faTrashAlt"/> {{ $t('clearQueue') }}</mk-button>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import MkButton from '../../components/ui/button.vue';
import XQueue from './queue.chart.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: `${this.$t('jobQueue')} | ${this.$t('instance')}`
		};
	},

	components: {
		MkButton,
		XQueue,
	},

	data() {
		return {
			connection: this.$root.stream.useSharedConnection('queueStats'),
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

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		clear() {
			this.$root.dialog({
				type: 'warning',
				title: this.$t('clearQueueConfirmTitle'),
				text: this.$t('clearQueueConfirmText'),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;

				this.$root.api('admin/queue/clear', {}).then(() => {
					this.$root.dialog({
						type: 'success',
						iconOnly: true, autoClose: true
					});
				});
			});
		}
	}
});
</script>
