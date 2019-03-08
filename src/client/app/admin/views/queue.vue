<template>
<div>
	<ui-card>
		<template #title>{{ $t('operation') }}</template>
		<section>
			<header>Deliver</header>
			<ui-horizon-group inputs v-if="stats">
				<ui-input :value="stats.deliver.waiting | number" type="text" readonly>
					<span>Waiting</span>
				</ui-input>
				<ui-input :value="stats.deliver.active | number" type="text" readonly>
					<span>Active</span>
				</ui-input>
				<ui-input :value="stats.deliver.delayed | number" type="text" readonly>
					<span>Delayed</span>
				</ui-input>
			</ui-horizon-group>
		</section>
		<section>
			<header>Inbox</header>
			<ui-horizon-group inputs v-if="stats">
				<ui-input :value="stats.inbox.waiting | number" type="text" readonly>
					<span>Waiting</span>
				</ui-input>
				<ui-input :value="stats.inbox.active | number" type="text" readonly>
					<span>Active</span>
				</ui-input>
				<ui-input :value="stats.inbox.delayed | number" type="text" readonly>
					<span>Delayed</span>
				</ui-input>
			</ui-horizon-group>
		</section>
		<section>
			<ui-button @click="removeAllJobs">{{ $t('remove-all-jobs') }}</ui-button>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';

export default Vue.extend({
	i18n: i18n('admin/views/queue.vue'),

	data() {
		return {
			stats: null
		};
	},

	created() {
		this.$root.api('admin/queue/stats').then(stats => {
			this.stats = stats;
		});
	},

	methods: {
		async removeAllJobs() {
			const process = async () => {
				await this.$root.api('admin/queue/clear');
				this.$root.dialog({
					type: 'success',
					splash: true
				});
			};

			await process().catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e.toString()
				});
			});
		},
	}
});
</script>
