<template>
<div class="root">
	<main>
		<div>
			<h1>Share<br>Everything!</h1>
			<p>ようこそ！ <b>Misskey</b>はTwitter風ミニブログSNSです――思ったこと、共有したいことをシンプルに書き残せます。タイムラインを見れば、皆の反応や皆がどう思っているのかもすぐにわかります。<a>詳しく...</a></p>
			<p><button class="signup" @click="signup">はじめる</button><button class="signin" @click="signin">ログイン</button></p>
		</div>
		<div>

		</div>
	</main>
	<mk-forkit/>
	<footer>
		<div>
			<mk-nav-links/>
			<p class="c">{ _COPYRIGHT_ }</p>
		</div>
	</footer>
	<modal name="signup">
		<mk-signup></mk-signup>
	</modal>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	methods: {
		signup() {
			this.$modal.show('signup');
		}
	}
});
</script>

<style>
#wait {
	right: auto;
	left: 15px;
}
</style>

<style lang="stylus" scoped>
.root
	display flex
	flex-direction column
	flex 1
	background #eee
	$width = 1000px

	> main
		display flex
		flex 1
		max-width $width
		margin 0 auto
		padding 80px 0 0 0

		> div:first-child
			margin 0 auto 0 0
			width calc(100% - 500px)
			color #777

			> h1
				margin 0
				font-weight normal
				font-variant small-caps
				letter-spacing 12px

			> p
				margin 0.5em 0
				line-height 2em

			button
				padding 8px 16px
				font-size inherit

			.signup
				color $theme-color
				border solid 2px $theme-color
				border-radius 4px

				&:focus
					box-shadow 0 0 0 3px rgba($theme-color, 0.2)

				&:hover
					color $theme-color-foreground
					background $theme-color

				&:active
					color $theme-color-foreground
					background darken($theme-color, 10%)
					border-color darken($theme-color, 10%)

			.signin
				&:focus
					color #444

				&:hover
					color #444

				&:active
					color #333

		> div:last-child
			margin 0 0 0 auto

	> footer
		background #fff

		*
			color #fff !important
			text-shadow 0 0 8px #000
			font-weight bold

		> div
			max-width $width
			margin 0 auto
			padding 16px 0
			text-align center
			border-top solid 1px #fff

			> .c
				margin 0
				line-height 64px
				font-size 10px

</style>
