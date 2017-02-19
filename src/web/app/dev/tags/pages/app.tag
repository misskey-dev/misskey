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
		@mixin \api

		@fetching = true

		@on \mount ~>
			@api \app/show do
				app_id: @opts.app
			.then (app) ~>
				@app = app
				@fetching = false
				@update!
	</script>
</mk-app-page>
