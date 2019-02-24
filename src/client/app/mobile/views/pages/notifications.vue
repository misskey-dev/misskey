<template>
<mk-ui>
	<template #header><span style="margin-right:4px;"><fa :icon="['far', 'bell']"/></span>{{ $t('notifications') }}</template>
	<template #func><button @click="fn"><fa icon="check"/></button></template>

	<main>
		<mk-notifications @fetched="onFetched"/>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/notifications.vue'),
	mounted() {
		document.title = this.$t('notifications');

		Progress.start();
	},
	methods: {
		fn() {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('read-all'),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;

				this.$root.api('notifications/mark_all_as_read');
			});
		},
		onFetched() {
			Progress.done();
		}
	}
});
</script>
