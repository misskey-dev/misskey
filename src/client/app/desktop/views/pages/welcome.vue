<template>
<div class="mk-welcome">
	<img ref="pointer" class="pointer" src="/assets/pointer.png" alt="">
	<button @click="dark">
		<template v-if="$store.state.device.darkmode">%fa:moon%</template>
		<template v-else>%fa:R moon%</template>
	</button>
	<div class="body">
		<div class="container">
			<div class="info">
				<span><b>{{ host }}</b></span>
				<span class="stats" v-if="stats">
					<span>%fa:user% {{ stats.originalUsersCount | number }}</span>
					<span>%fa:pencil-alt% {{ stats.originalNotesCount | number }}</span>
				</span>
			</div>
			<main>
				<div class="about">
					<h1 v-if="name != 'Misskey'">{{ name }}</h1>
					<h1 v-else><img :src="$store.state.device.darkmode ? 'assets/title.dark.svg' : 'assets/title.light.svg'" :alt="name"></h1>
					<p class="powerd-by" v-if="name != 'Misskey'" v-html="'%i18n:@powered-by-misskey%'"></p>
					<p class="desc" v-html="description || '%i18n:common.about%'"></p>
					<a ref="signup" @click="signup">📦 %i18n:@signup%</a>
				</div>
				<div class="login">
					<mk-signin/>
				</div>
			</main>
			<div class="hashtags">
				<router-link v-for="tag in tags" :key="tag" :to="`/tags/${ tag }`" :title="tag">#{{ tag }}</router-link>
			</div>
			<mk-nav class="nav"/>
		</div>
		<mk-forkit class="forkit"/>
		<img src="assets/title.dark.svg" :alt="name">
	</div>
	<div class="tl">
		<mk-welcome-timeline :max="20"/>
	</div>

	<modal name="signup" width="500px" height="auto" scrollable>
		<header :class="$style.signupFormHeader">%i18n:@signup%</header>
		<mk-signup :class="$style.signupForm"/>
	</modal>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { host, copyright } from '../../../config';

export default Vue.extend({
	data() {
		return {
			stats: null,
			copyright,
			host,
			name: 'Misskey',
			description: '',
			pointerInterval: null,
			tags: []
		};
	},
	created() {
		(this as any).os.getMeta().then(meta => {
			this.name = meta.name;
			this.description = meta.description;
		});

		(this as any).api('stats').then(stats => {
			this.stats = stats;
		});

		(this as any).api('hashtags/trend').then(stats => {
			this.tags = stats.map(x => x.tag);
		});
	},
	mounted() {
		this.point();
		this.pointerInterval = setInterval(this.point, 100);
	},
	beforeDestroy() {
		clearInterval(this.pointerInterval);
	},
	methods: {
		point() {
			const x = this.$refs.signup.getBoundingClientRect();
			this.$refs.pointer.style.top = x.top + x.height + 'px';
			this.$refs.pointer.style.left = x.left + 'px';
		},
		signup() {
			this.$modal.show('signup');
		},
		signin() {
			this.$modal.show('signin');
		},
		dark() {
			this.$store.commit('device/set', {
				key: 'darkmode',
				value: !this.$store.state.device.darkmode
			});
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

root(isDark)
	display flex
	min-height 100vh

	> .pointer
		display block
		position absolute
		z-index 1
		top 0
		right 0
		width 180px
		margin 0 0 0 -180px
		transform rotateY(180deg) translateX(-10px) translateY(-48px)
		pointer-events none

	> button
		position fixed
		z-index 1
		top 0
		left 0
		padding 16px
		font-size 18px
		color #fff

		display none // TODO

	> .body
		flex 1
		padding 64px 0 0 0
		text-align center
		background #578394
		background-position center
		background-size cover

		&:before
			content ''
			display block
			position absolute
			top 0
			left 0
			right 0
			bottom 0
			background rgba(#000, 0.5)

		> .forkit
			position absolute
			top 0
			right 0

		> img
			position absolute
			bottom 16px
			right 16px
			width 150px

		> .container
			$aboutWidth = 380px
			$loginWidth = 340px
			$width = $aboutWidth + $loginWidth

			> .info
				margin 0 auto 16px auto
				width $width
				font-size 14px
				color #fff

				> .stats
					margin-left 16px
					padding-left 16px
					border-left solid 1px #fff

					> *
						margin-right 16px

			> main
				display flex
				margin auto
				width $width
				border-radius 8px
				overflow hidden
				box-shadow 0 2px 8px rgba(#000, 0.3)

				> .about
					width $aboutWidth
					color #444
					background #fff

					> h1
						margin 0 0 16px 0
						padding 32px 32px 0 32px
						color #444

						> img
							width 170px
							vertical-align bottom

					> .powerd-by
						margin 16px
						opacity 0.7

					> .desc
						margin 0
						padding 0 32px 16px 32px

					> a
						display inline-block
						margin 0 0 32px 0
						font-weight bold

				> .login
					width $loginWidth
					padding 16px 32px 32px 32px
					background isDark ? #2e3440 : #f5f5f5

			> .hashtags
				margin 16px auto
				width $width
				font-size 14px
				color #fff
				background rgba(#000, 0.3)
				border-radius 8px

				> *
					display inline-block
					margin 14px

			> .nav
				display block
				margin 16px 0
				font-size 14px
				color #fff

	> .tl
		margin 0
		width 410px
		height 100vh
		text-align left
		background isDark ? #313543 : #fff

		> *
			max-height 100%
			overflow auto

.mk-welcome[data-darkmode]
	root(true)

.mk-welcome:not([data-darkmode])
	root(false)

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
