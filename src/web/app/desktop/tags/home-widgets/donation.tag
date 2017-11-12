<mk-donation-home-widget>
	<article>
		<h1><i class="fa fa-heart"></i>%i18n:desktop.tags.mk-donation-home-widget.title%</h1>
		<p>{'%i18n:desktop.tags.mk-donation-home-widget.text%'.substr(0, '%i18n:desktop.tags.mk-donation-home-widget.text%'.indexOf('{'))}<a href="/syuilo" data-user-preview="@syuilo">@syuilo</a>{'%i18n:desktop.tags.mk-donation-home-widget.text%'.substr('%i18n:desktop.tags.mk-donation-home-widget.text%'.indexOf('}') + 1)}</p>
	</article>
	<style>
		:scope
			display block
			background #fff
			border-color #ead8bb !important

			> article
				padding 20px

				> h1
					margin 0 0 5px 0
					font-size 1em
					color #888

					> i
						margin-right 0.25em

				> p
					display block
					z-index 1
					margin 0
					font-size 0.8em
					color #999

	</style>
	<script>
		this.mixin('widget');
		this.mixin('user-preview');
	</script>
</mk-donation-home-widget>
