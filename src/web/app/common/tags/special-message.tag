<mk-special-message>
	<p if={ m == 1 && d == 1 }>Happy New Year! </p>
	<p if={ m == 12 && d == 25 }>Merry Christmas!</p>
	<style type="stylus">
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
		now = new Date!
		@d = now.get-date!
		@m = now.get-month! + 1
	</script>
</mk-special-message>
