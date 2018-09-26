<template>
<div class="header" :data-is-dark-background="user.bannerUrl != null">
	<div class="banner-container" :style="style">
		<div class="banner" ref="banner" :style="style" @click="onBannerClick"></div>
		<div class="fade"></div>
		<div class="title">
			<p class="name">{{ user | userName }}</p>
			<div>
				<span class="username"><mk-acct :user="user" :detail="true" /></span>
				<span v-if="user.isBot" title="%i18n:@is-bot%">%fa:robot%</span>
				<span class="location" v-if="user.host === null && user.profile.location">%fa:map-marker% {{ user.profile.location }}</span>
				<span class="birthday" v-if="user.host === null && user.profile.birthday">%fa:birthday-cake% {{ user.profile.birthday.replace('-', '年').replace('-', '月') + '日' }} ({{ age }}歳)</span>
			</div>
		</div>
	</div>
	<mk-avatar class="avatar" :user="user" :disable-preview="true"/>
	<div class="body">
		<div class="description">
			<misskey-flavored-markdown v-if="user.description" :text="user.description" :i="$store.state.i"/>
		</div>
		<div class="status">
			<span class="notes-count"><b>{{ user.notesCount | number }}</b>%i18n:@posts%</span>
			<span class="following clickable" @click="showFollowing"><b>{{ user.followingCount | number }}</b>%i18n:@following%</span>
			<span class="followers clickable" @click="showFollowers"><b>{{ user.followersCount | number }}</b>%i18n:@followers%</span>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import MkFollowingWindow from '../../components/following-window.vue';
import MkFollowersWindow from '../../components/followers-window.vue';
import * as age from 's-age';

export default Vue.extend({
	props: ['user'],
	computed: {
		style(): any {
			if (this.user.bannerUrl == null) return {};
			return {
				backgroundColor: this.user.bannerColor && this.user.bannerColor.length == 3 ? `rgb(${ this.user.bannerColor.join(',') })` : null,
				backgroundImage: `url(${ this.user.bannerUrl })`
			};
		},

		age(): number {
			return age(this.user.profile.birthday);
		}
	},
	mounted() {
		if (this.user.bannerUrl) {
			//window.addEventListener('load', this.onScroll);
			//window.addEventListener('scroll', this.onScroll, { passive: true });
			//window.addEventListener('resize', this.onScroll);
		}
	},
	beforeDestroy() {
		if (this.user.bannerUrl) {
			//window.removeEventListener('load', this.onScroll);
			//window.removeEventListener('scroll', this.onScroll);
			//window.removeEventListener('resize', this.onScroll);
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
			if (!this.$store.getters.isSignedIn || this.$store.state.i.id != this.user.id) return;

			(this as any).apis.updateBanner().then(i => {
				this.user.bannerUrl = i.bannerUrl;
			});
		},

		showFollowing() {
			(this as any).os.new(MkFollowingWindow, {
				user: this.user
			});
		},

		showFollowers() {
			(this as any).os.new(MkFollowersWindow, {
				user: this.user
			});
		},
	}
});
</script>

<style lang="stylus" scoped>


root(isDark)
	background var(--face)
	box-shadow var(--shadow)
	border-radius var(--round)
	overflow hidden

	&[data-is-dark-background]
		> .banner-container
			> .banner
				background-color #383838

			> .fade
				background linear-gradient(transparent, rgba(#000, 0.7))

			> .title
				color #fff

				> .name
					text-shadow 0 0 8px #000

	> .banner-container
		height 250px
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

		> .title
			position absolute
			bottom 0
			left 0
			width 100%
			padding 0 0 8px 154px
			color #5e6367

			> .name
				display block
				margin 0
				line-height 32px
				font-weight bold
				font-size 1.8em

			> div
				> *
					display inline-block
					margin-right 16px
					line-height 20px
					opacity 0.8

					&.username
						font-weight bold

	> .avatar
		display block
		position absolute
		top 170px
		left 16px
		z-index 2
		width 120px
		height 120px
		box-shadow 1px 1px 3px rgba(#000, 0.2)

		> &.cat::before,
		> &.cat::after
			border-width 8px

	> .body
		padding 16px 16px 16px 154px
		color isDark ? #c5ced6 : #555

		> .status
			margin-top 16px
			padding-top 16px
			border-top solid 1px rgba(#000, isDark ? 0.2 : 0.1)
			font-size 80%

			> *
				display inline-block
				padding-right 16px
				margin-right 16px

				&:not(:last-child)
					border-right solid 1px rgba(#000, isDark ? 0.2 : 0.1)

				&.clickable
					cursor pointer

					&:hover
						color isDark ? #fff : #000

				> b
					margin-right 4px
					font-size 1rem
					font-weight bold
					color var(--primary)

.header[data-darkmode]
	root(true)

.header:not([data-darkmode])
	root(false)

</style>
