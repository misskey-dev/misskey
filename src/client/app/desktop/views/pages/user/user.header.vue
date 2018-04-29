<template>
<div class="header" :data-is-dark-background="user.bannerUrl != null">
	<div class="is-suspended" v-if="user.isSuspended"><p>%fa:exclamation-triangle% %i18n:@is-suspended%</p></div>
	<div class="is-remote" v-if="user.host != null"><p>%fa:exclamation-triangle% %i18n:@is-remote%<a :href="user.url || user.uri" target="_blank">%i18n:@view-remote%</a></p></div>
	<div class="banner-container" :style="user.bannerUrl ? `background-image: url(${user.bannerUrl}?thumbnail&size=2048)` : ''">
		<div class="banner" ref="banner" :style="user.bannerUrl ? `background-image: url(${user.bannerUrl}?thumbnail&size=2048)` : ''" @click="onBannerClick"></div>
		<div class="fade"></div>
	</div>
	<div class="container">
		<mk-avatar class="avatar" :user="user" :disable-preview="true"/>
		<div class="title">
			<p class="name">{{ user | userName }}</p>
			<p class="username">@{{ user | acct }}</p>
			<p class="location" v-if="user.host === null && user.profile.location">%fa:map-marker%{{ user.profile.location }}</p>
		</div>
		<footer>
			<router-link :to="user | userPage" :data-active="$parent.page == 'home'">%fa:home%ホーム</router-link>
		</footer>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['user'],
	mounted() {
		if (this.user.bannerUrl) {
			window.addEventListener('load', this.onScroll);
			window.addEventListener('scroll', this.onScroll);
			window.addEventListener('resize', this.onScroll);
		}
	},
	beforeDestroy() {
		if (this.user.bannerUrl) {
			window.removeEventListener('load', this.onScroll);
			window.removeEventListener('scroll', this.onScroll);
			window.removeEventListener('resize', this.onScroll);
		}
	},
	methods: {
		onScroll() {
			const banner = this.$refs.banner as any;

			const top = window.scrollY;

			const z = 1.25; // 奥行き(小さいほど奥)
			const pos = -(top / z);
			banner.style.backgroundPosition = `center calc(50% - ${pos}px)`;

			const blur = top / 32
			if (blur <= 10) banner.style.filter = `blur(${blur}px)`;
		},

		onBannerClick() {
			if (!(this as any).os.isSignedIn || (this as any).os.i.id != this.user.id) return;

			(this as any).apis.updateBanner().then(i => {
				this.user.bannerUrl = i.bannerUrl;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.header
	$footer-height = 58px

	overflow hidden
	background #f7f7f7
	box-shadow 0 1px 1px rgba(#000, 0.075)

	> .is-suspended
	> .is-remote
		&.is-suspended
			color #570808
			background #ffdbdb

		&.is-remote
			color #573c08
			background #fff0db

		> p
			margin 0 auto
			padding 14px 16px
			max-width 1200px
			font-size 14px

			> a
				font-weight bold

	&[data-is-dark-background]
		> .banner-container
			> .banner
				background-color #383838

			> .fade
				background linear-gradient(transparent, rgba(#000, 0.7))

		> .container
			> .title
				color #fff

				> .name
					text-shadow 0 0 8px #000

	> .banner-container
		height 320px
		overflow hidden
		background-size cover
		background-position center

		> .banner
			height 100%
			background-color #bfccd0
			background-size cover
			background-position center

		> .fade
			position absolute
			bottom 0
			left 0
			width 100%
			height 78px

	> .container
		max-width 1200px
		margin 0 auto

		> .avatar
			display block
			position absolute
			bottom 16px
			left 16px
			z-index 2
			width 160px
			height 160px
			border solid 3px #fff
			border-radius 8px
			box-shadow 1px 1px 3px rgba(#000, 0.2)

		> .title
			position absolute
			bottom $footer-height
			left 0
			width 100%
			padding 0 0 8px 195px
			color #5e6367
			font-family '游ゴシック', 'YuGothic', 'ヒラギノ角ゴ ProN W3', 'Hiragino Kaku Gothic ProN', 'Meiryo', 'メイリオ', sans-serif

			> .name
				display block
				margin 0
				line-height 40px
				font-weight bold
				font-size 2em

			> .username
			> .location
				display inline-block
				margin 0 16px 0 0
				line-height 20px
				opacity 0.8

				> i
					margin-right 4px

		> footer
			z-index 1
			height $footer-height
			padding-left 195px

			> a
				display inline-block
				margin 0
				padding 0 16px
				height $footer-height
				line-height $footer-height
				color #555

				&[data-active]
					border-bottom solid 4px $theme-color

				> i
					margin-right 6px

			> button
				display block
				position absolute
				top 0
				right 0
				margin 8px
				padding 0
				width $footer-height - 16px
				line-height $footer-height - 16px - 2px
				font-size 1.2em
				color #777
				border solid 1px #eee
				border-radius 4px

				&:hover
					color #555
					border solid 1px #ddd

</style>
