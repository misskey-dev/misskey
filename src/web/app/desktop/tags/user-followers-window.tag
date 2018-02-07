<mk-user-followers-window>
	<mk-window is-modal={ false } width={ '400px' } height={ '550px' }><yield to="header"><img src={ parent.user.avatar_url + '?thumbnail&size=64' } alt=""/>{ parent.user.name }のフォロワー</yield>
<yield to="content">
		<mk-user-followers user={ parent.user }/></yield>
	</mk-window>
	<style lang="stylus" scoped>
		:scope
			> mk-window
				[data-yield='header']
					> img
						display inline-block
						vertical-align bottom
						height calc(100% - 10px)
						margin 5px
						border-radius 4px

	</style>
	<script>this.user = this.opts.user</script>
</mk-user-followers-window>
