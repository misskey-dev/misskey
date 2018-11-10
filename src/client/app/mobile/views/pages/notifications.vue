<template>
<mk-ui>
	<span slot="header"><span style="margin-right:4px;"><fa :icon="['far', 'bell']"/></span>{{ $t('notifications') }}</span>
	<template slot="func"><button @click="fn"><fa icon="check"/></button></template>

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
			const ok = window.confirm(this.$t('read-all'));
			if (!ok) return;

			this.$root.api('notifications/mark_all_as_read');
		},
		onFetched() {
			Progress.done();
		}
	}
});
</script>

<style lang="stylus" scoped>


main
	width 100%
	max-width 680px
	margin 0 auto
	padding 8px

	@media (min-width 500px)
		padding 16px

	@media (min-width 600px)
		padding 32px

</style>
