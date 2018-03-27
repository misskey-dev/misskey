<mk-header>
	<div>
		<a href={ _CH_URL_ }>Index</a> | <a href={ _URL_ }>Misskey</a>
	</div>
	<div>
		<a v-if="!$root.$data.os.isSignedIn" href={ _URL_ }>ログイン(新規登録)</a>
		<a v-if="$root.$data.os.isSignedIn" href={ _URL_ + '/@' + I.username }>{ I.username }</a>
	</div>
	<style lang="stylus" scoped>
		:scope
			display flex

			> div:last-child
				margin-left auto

	</style>
	<script lang="typescript">
		this.mixin('i');
	</script>
</mk-header>
