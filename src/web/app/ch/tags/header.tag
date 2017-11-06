<mk-header>
	<div>
		<a href={ CONFIG.chUrl }>Index</a> | <a href={ CONFIG.url }>Misskey</a>
	</div>
	<div>
		<a if={ !SIGNIN } href={ CONFIG.url }>ログイン(新規登録)</a>
		<a if={ SIGNIN } href={ CONFIG.url + '/' + I.username }>{ I.username }</a>
	</div>
	<style>
		:scope
			display flex

			> div:last-child
				margin-left auto

	</style>
	<script>
		this.mixin('i');
	</script>
</mk-header>
