<template>
<div>
	<ui-card>
		<template #title>{{ $t('operation') }}</template>
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
		};
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
