<template>
<div class="mkw-donation">
	<article>
		<h1>%fa:heart%%i18n:desktop.tags.mk-donation-home-widget.title%</h1>
		<p>
			{{ '%i18n:desktop.tags.mk-donation-home-widget.text%'.substr(0, '%i18n:desktop.tags.mk-donation-home-widget.text%'.indexOf('{')) }}
			<a href="/syuilo" v-user-preview="@syuilo">@syuilo</a>
			{{ '%i18n:desktop.tags.mk-donation-home-widget.text%'.substr('%i18n:desktop.tags.mk-donation-home-widget.text%'.indexOf('}') + 1) }}
		</p>
	</article>
</div>
</template>

<script lang="ts">
import define from '../../../../common/define-widget';
export default define({
	name: 'donation'
});
</script>

<style lang="stylus" scoped>
.mkw-donation
	background #fff
	border solid 1px #ead8bb
	border-radius 6px

	> article
		padding 20px

		> h1
			margin 0 0 5px 0
			font-size 1em
			color #888

			> [data-fa]
				margin-right 0.25em

		> p
			display block
			z-index 1
			margin 0
			font-size 0.8em
			color #999

</style>
