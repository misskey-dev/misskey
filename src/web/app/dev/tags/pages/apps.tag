<mk-apps-page>
	<h1>アプリを管理</h1><a href="/app/new">アプリ作成</a>
	<div class="apps">
		<p if={ fetching }>読み込み中</p>
		<virtual if={ !fetching }>
			<p if={ apps.length == 0 }>アプリなし</p>
			<ul if={ apps.length > 0 }>
				<li each={ app in apps }><a href={ '/app/' + app.id }>
						<p class="name">{ app.name }</p></a></li>
			</ul>
		</virtual>
	</div>
	<style lang="stylus" scoped>
		:scope
			display block
	</style>
	<script>
		this.mixin('api');

		this.fetching = true;

		this.on('mount', () => {
			this.api('my/apps').then(apps => {
				this.fetching = false
				this.apps = apps
				this.update({
					fetching: false,
					apps: apps
				});
			});
		});
	</script>
</mk-apps-page>
