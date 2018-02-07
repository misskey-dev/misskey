<mk-header>
	<div>
		<a href={ _CH_URL_ }>Index</a> | <a href={ _URL_ }>Misskey</a>
	</div>
	<div>
		<a if={ !SIGNIN } href={ _URL_ }>ログイン(新規登録)</a>
		<a if={ SIGNIN } href={ _URL_ + '/' + I.username }>{ I.username }</a>
	</div>
	<style lang="stylus" scoped>
		:scope
			display flex

			> div:last-child
				margin-left auto

	</style>
	<script>
		this.mixin('i');
	</script>
</mk-header>
