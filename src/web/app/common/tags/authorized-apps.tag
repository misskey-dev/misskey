<mk-authorized-apps>
	<p class="none" if={ !fetching && apps.length == 0 }>連携しているアプリケーションはありません。</p>
	<div class="apps" if={ apps.length != 0 }>
		<div each={ app in apps }>
			<p><b>{ app.name }</b></p>
			<p>{ app.description }</p>
		</div>
	</div>
	<style>
		:scope
			display block

			> .apps
				> div
					padding 16px 0 0 0
					border-bottom solid 1px #eee

	</style>
	<script>
		this.mixin('api');

		this.apps = [];
		this.fetching = true;

		this.on('mount', () => {
			this.api('i/authorized_apps').then(apps => {
				this.apps = apps;
				this.fetching = false;
				this.update();
			});
		});
	</script>
</mk-authorized-apps>
