<mk-special-message>
	<p if={ m == 1 && d == 1 }>%i18n:common.tags.mk-special-message.new-year%</p>
	<p if={ m == 12 && d == 25 }>%i18n:common.tags.mk-special-message.christmas%</p>
	<style lang="stylus" scoped>
		:scope
			display block

			&:empty
				display none

			> p
				margin 0
				padding 4px
				text-align center
				font-size 14px
				font-weight bold
				text-transform uppercase
				color #fff
				background #ff1036

	</style>
	<script>
		const now = new Date();
		this.d = now.getDate();
		this.m = now.getMonth() + 1;
	</script>
</mk-special-message>
