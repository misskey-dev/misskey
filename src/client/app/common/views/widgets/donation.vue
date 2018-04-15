<template>
<div class="mkw-donation" :data-mobile="isMobile">
	<article>
		<h1>%fa:heart%%i18n:@title%</h1>
		<p>
			{{ '%i18n:!@text%'.substr(0, '%i18n:!@text%'.indexOf('{')) }}
			<a href="https://syuilo.com">@syuilo</a>
			{{ '%i18n:!@text%'.substr('%i18n:!@text%'.indexOf('}') + 1) }}
		</p>
	</article>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
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

	&[data-mobile]
		border none
		background #ead8bb
		border-radius 8px
		box-shadow 0 0 0 1px rgba(0, 0, 0, 0.2)

		> article
			> h1
				color #7b8871

			> p
				color #777d71

</style>
