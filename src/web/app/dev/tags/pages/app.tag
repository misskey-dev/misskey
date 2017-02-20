<mk-app-page>
	<p if={ fetching }>読み込み中</p>
	<main if={ !fetching }>
		<header>
			<h1>{ app.name }</h1>
		</header>
		<div class="body">
			<p>App Secret</p>
			<input value={ app.secret } readonly="readonly"/>
		</div>
	</main>
	<style>
		:scope
			display block

	</style>
	<script>
		this.mixin('api');

		this.fetching = true

		this.on('mount', () => {
			this.api 'app/show' do
				app_id: this.opts.app
			.then (app) =>
				this.app = app
				this.fetching = false
				this.update();
	</script>
</mk-app-page>
