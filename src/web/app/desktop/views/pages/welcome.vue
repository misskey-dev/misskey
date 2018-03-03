<template>
<div class="mk-welcome">
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
			<mk-nav :class="$style.nav"/>
			<p class="c">{{ copyright }}</p>
		</div>
	</footer>
	<modal name="signup" width="500px" height="auto" scrollable>
		<header :class="$style.signupFormHeader">新規登録</header>
		<mk-signup :class="$style.signupForm"/>
	</modal>
	<modal name="signin" width="500px" height="auto" scrollable>
		<header :class="$style.signinFormHeader">ログイン</header>
		<mk-signin :class="$style.signinForm"/>
	</modal>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { copyright } from '../../../config';

export default Vue.extend({
	data() {
		return {
			copyright
		};
	},
	methods: {
		signup() {
			this.$modal.show('signup');
		},
		signin() {
			this.$modal.show('signin');
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
@import '~const.styl'

.mk-welcome
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
		color #666
		background #fff

		> div
			max-width $width
			margin 0 auto
			padding 42px 0
			text-align center

			> .c
				margin 16px 0 0 0
				font-size 10px

</style>

<style lang="stylus" module>
.signupForm
	padding 24px 48px 48px 48px

.signupFormHeader
	padding 48px 0 12px 0
	margin: 0 48px
	font-size 1.5em
	color #777
	border-bottom solid 1px #eee

.signinForm
	padding 24px 48px 48px 48px

.signinFormHeader
	padding 48px 0 12px 0
	margin: 0 48px
	font-size 1.5em
	color #777
	border-bottom solid 1px #eee

.nav
	a
		color #666
</style>
