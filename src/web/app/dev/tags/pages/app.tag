<mk-app-page>
	<p v-if="fetching">読み込み中</p>
	<main v-if="!fetching">
		<header>
			<h1>{ app.name }</h1>
		</header>
		<div class="body">
			<p>App Secret</p>
			<input value={ app.secret } readonly="readonly"/>
		</div>
	</main>
	<style lang="stylus" scoped>
		:scope
			display block
	</style>
	<script lang="typescript">
		this.mixin('api');

		this.fetching = true;

		this.on('mount', () => {
			this.$root.$data.os.api('app/show', {
				app_id: this.opts.app
			}).then(app => {
				this.update({
					fetching: false,
					app: app
				});
			});
		});
	</script>
</mk-app-page>
