<template>
<div class="mk-welcome">
	<main>
		<div class="top">
			<div>
				<div>
					<h1>Share<br><span ref="share">Everything!</span><span class="cursor">_</span></h1>
					<p>ようこそ！ <b>Misskey</b>はTwitter風ミニブログSNSです。思ったことや皆と共有したいことを投稿しましょう。タイムラインを見れば、皆の関心事をすぐにチェックすることもできます。<a :href="aboutUrl">詳しく...</a></p>
					<p><button class="signup" @click="signup">はじめる</button><button class="signin" @click="signin">ログイン</button></p>
					<div class="users">
						<router-link v-for="user in users" :key="user.id" class="avatar-anchor" :to="`/@${user.username}`" v-user-preview="user.id">
							<img class="avatar" :src="`${user.avatar_url}?thumbnail&size=64`" alt="avatar"/>
						</router-link>
					</div>
				</div>
				<div>
					<div>
						<header>%fa:comments R% タイムライン<div><span></span><span></span><span></span></div></header>
						<mk-welcome-timeline/>
					</div>
				</div>
			</div>
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
import { docsUrl, copyright, lang } from '../../../config';

const shares = [
	'Everything!',
	'Webpages',
	'Photos',
	'Interests',
	'Favorites'
];

export default Vue.extend({
	data() {
		return {
			aboutUrl: `${docsUrl}/${lang}/about`,
			copyright,
			users: [],
			clock: null,
			i: 0
		};
	},
	mounted() {
		(this as any).api('users', {
			sort: '+follower',
			limit: 20
		}).then(users => {
			this.users = users;
		});

		this.clock = setInterval(() => {
			if (++this.i == shares.length) this.i = 0;
			const speed = 70;
			const text = (this.$refs.share as any).innerText;
			for (let i = 0; i < text.length; i++) {
				setTimeout(() => {
					if (this.$refs.share) {
						(this.$refs.share as any).innerText = text.substr(0, text.length - i);
					}
				}, i * speed)
			}
			setTimeout(() => {
				const newText = shares[this.i];
				for (let i = 0; i <= newText.length; i++) {
					setTimeout(() => {
						if (this.$refs.share) {
							(this.$refs.share as any).innerText = newText.substr(0, i);
						}
					}, i * speed)
				}
			}, text.length * speed);
		}, 4000);
	},
	beforeDestroy() {
		clearInterval(this.clock);
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

@import url('https://fonts.googleapis.com/css?family=Sarpanch:700')

.mk-welcome
	display flex
	flex-direction column
	flex 1
	$width = 1000px

	background-image url('/assets/welcome-bg.svg')
	background-size cover
	background-position top center

	&:before
		content ""
		display block
		position fixed
		bottom 0
		left 0
		width 100%
		height 100%
		background-image url('/assets/welcome-fg.svg')
		background-size cover
		background-position bottom center

	> main
		display flex
		flex 1

		> .top
			display flex
			width 100%

			> div
				display flex
				max-width $width + 64px
				margin 0 auto
				padding 80px 32px 0 32px

				> *
					margin-bottom 48px

				> div:first-child
					margin-right 48px
					color #fff
					text-shadow 0 0 12px #172062

					> h1
						margin 0
						font-weight bold
						//font-variant small-caps
						letter-spacing 12px
						font-family 'Sarpanch', sans-serif
						font-size 42px
						line-height 48px

						> .cursor
							animation cursor 1s infinite linear both

							@keyframes cursor
								0%
									opacity 1
								50%
									opacity 0

					> p
						margin 1em 0
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
						&:hover
							color #fff

					> .users
						margin 16px 0 0 0

						> *
							display inline-block
							margin 4px

							> *
								display inline-block
								width 38px
								height 38px
								vertical-align top
								border-radius 6px

				> div:last-child

					> div
						width 410px
						background #fff
						border-radius 8px
						box-shadow 0 0 0 12px rgba(0, 0, 0, 0.1)
						overflow hidden

						> header
							z-index 1
							padding 12px 16px
							color #888d94
							box-shadow 0 1px 0px rgba(0, 0, 0, 0.1)

							> div
								position absolute
								top 0
								right 0
								padding inherit

								> span
									display inline-block
									height 11px
									width 11px
									margin-left 6px
									background #ccc
									border-radius 100%
									vertical-align middle

									&:nth-child(1)
										background #5BCC8B

									&:nth-child(2)
										background #E6BB46

									&:nth-child(3)
										background #DF7065

						> .mk-welcome-timeline
							max-height 350px
							overflow auto

	> footer
		font-size 12px
		color #949ea5

		> div
			max-width $width
			margin 0 auto
			padding 0 0 42px 0
			text-align center

			> .c
				margin 16px 0 0 0
				font-size 10px
				opacity 0.7

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

<style lang="stylus">
html
body
	background linear-gradient(to bottom, #1e1d65, #bd6659)
</style>
