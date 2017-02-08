<mk-authorized-apps>
	<p class="none" if={ !fetching && apps.length == 0 }>連携しているアプリケーションはありません。</p>
	<div class="apps" if={ apps.length != 0 }>
		<div each={ app in apps }>
			<p><b>{ app.name }</b></p>
			<p>{ app.description }</p>
		</div>
	</div>
	<style type="stylus">
		:scope
			display block

			> .apps
				> div
					padding 16px 0 0 0
					border-bottom solid 1px #eee

	</style>
	<script>
		@mixin \api

		@apps = []
		@fetching = true

		@on \mount ~>
			@api \i/authorized_apps
			.then (apps) ~>
				@apps = apps
				@fetching = false
				@update!
			.catch (err) ~>
				console.error err
	</script>
</mk-authorized-apps>
