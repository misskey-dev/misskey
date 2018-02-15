<mk-authorized-apps>
	<div class="none ui info" v-if="!fetching && apps.length == 0">
		<p>%fa:info-circle%%i18n:common.tags.mk-authorized-apps.no-apps%</p>
	</div>
	<div class="apps" v-if="apps.length != 0">
		<div each={ app in apps }>
			<p><b>{ app.name }</b></p>
			<p>{ app.description }</p>
		</div>
	</div>
	<style lang="stylus" scoped>
		:scope
			display block

			> .apps
				> div
					padding 16px 0 0 0
					border-bottom solid 1px #eee

	</style>
	<script lang="typescript">
		this.mixin('api');

		this.apps = [];
		this.fetching = true;

		this.on('mount', () => {
			this.$root.$data.os.api('i/authorized_apps').then(apps => {
				this.apps = apps;
				this.fetching = false;
				this.update();
			});
		});
	</script>
</mk-authorized-apps>
