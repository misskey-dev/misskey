<template>
<mk-ui>
	<span slot="header">%fa:R bell%%i18n:@notifications%</span>
	<template slot="func"><button @click="fn">%fa:check%</button></template>

	<main>
		<mk-notifications @fetched="onFetched"/>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	mounted() {
		document.title = 'Misskey | %i18n:@notifications%';

		Progress.start();
	},
	methods: {
		fn() {
			const ok = window.confirm('%i18n:!@read-all%');
			if (!ok) return;

			(this as any).api('notifications/markAsRead_all');
		},
		onFetched() {
			Progress.done();
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

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
