<template>
<mk-ui>
	<span slot="header" v-if="!fetching">%fa:user% {{ user.name }}</span>
	<main v-if="!fetching">
		<header>
			<div class="banner" :style="user.bannerUrl ? `background-image: url(${user.bannerUrl}?thumbnail&size=1024)` : ''"></div>
			<div class="body">
				<div class="top">
					<a class="avatar">
						<img :src="`${user.avatarUrl}?thumbnail&size=200`" alt="avatar"/>
					</a>
					<mk-follow-button v-if="os.isSignedIn && os.i.id != user.id" :user="user"/>
				</div>
				<div class="title">
					<h1>{{ user.name }}</h1>
					<span class="username">@{{ acct }}</span>
					<span class="followed" v-if="user.isFollowed">%i18n:mobile.tags.mk-user.follows-you%</span>
				</div>
				<div class="description">{{ user.description }}</div>
				<div class="info">
					<p class="location" v-if="user.host === null && user.account.profile.location">
						%fa:map-marker%{{ user.account.profile.location }}
					</p>
					<p class="birthday" v-if="user.host === null && user.account.profile.birthday">
						%fa:birthday-cake%{{ user.account.profile.birthday.replace('-', '年').replace('-', '月') + '日' }} ({{ age }}歳)
					</p>
				</div>
				<div class="status">
					<a>
						<b>{{ user.postsCount | number }}</b>
						<i>%i18n:mobile.tags.mk-user.posts%</i>
					</a>
					<a :href="`@${acct}/following`">
						<b>{{ user.followingCount | number }}</b>
						<i>%i18n:mobile.tags.mk-user.following%</i>
					</a>
					<a :href="`@${acct}/followers`">
						<b>{{ user.followersCount | number }}</b>
						<i>%i18n:mobile.tags.mk-user.followers%</i>
					</a>
				</div>
			</div>
		</header>
		<nav>
			<div class="nav-container">
				<a :data-is-active=" page == 'home' " @click="page = 'home'">%i18n:mobile.tags.mk-user.overview%</a>
				<a :data-is-active=" page == 'posts' " @click="page = 'posts'">%i18n:mobile.tags.mk-user.timeline%</a>
				<a :data-is-active=" page == 'media' " @click="page = 'media'">%i18n:mobile.tags.mk-user.media%</a>
			</div>
		</nav>
		<div class="body">
			<x-home v-if="page == 'home'" :user="user"/>
			<mk-user-timeline v-if="page == 'posts'" :user="user"/>
			<mk-user-timeline v-if="page == 'media'" :user="user" with-media/>
		</div>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import * as age from 's-age';
import getAcct from '../../../../../common/user/get-acct';
import getAcct from '../../../../../common/user/parse-acct';
import Progress from '../../../common/scripts/loading';
import XHome from './user/home.vue';

export default Vue.extend({
	components: {
		XHome
	},
	data() {
		return {
			fetching: true,
			user: null,
			page: 'home'
		};
	},
	computed: {
		acct() {
			return this.getAcct(this.user);
		},
		age(): number {
			return age(this.user.account.profile.birthday);
		}
	},
	watch: {
		$route: 'fetch'
	},
	created() {
		this.fetch();
	},
	mounted() {
		document.documentElement.style.background = '#313a42';
	},
	methods: {
		fetch() {
			Progress.start();

			(this as any).api('users/show', parseAcct(this.$route.params.user)).then(user => {
				this.user = user;
				this.fetching = false;

				Progress.done();
				document.title = user.name + ' | Misskey';
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

main
	> header

		> .banner
			padding-bottom 33.3%
			background-color #1b1b1b
			background-size cover
			background-position center

		> .body
			padding 12px
			margin 0 auto
			max-width 600px

			> .top
				&:after
					content ''
					display block
					clear both

				> .avatar
					display block
					float left
					width 25%
					height 40px

					> img
						display block
						position absolute
						left -2px
						bottom -2px
						width 100%
						border 3px solid #313a42
						border-radius 6px

						@media (min-width 500px)
							left -4px
							bottom -4px
							border 4px solid #313a42
							border-radius 12px

				> .mk-follow-button
					float right
					height 40px

			> .title
				margin 8px 0

				> h1
					margin 0
					line-height 22px
					font-size 20px
					color #fff

				> .username
					display inline-block
					line-height 20px
					font-size 16px
					font-weight bold
					color #657786

				> .followed
					margin-left 8px
					padding 2px 4px
					font-size 12px
					color #657786
					background #f8f8f8
					border-radius 4px

			> .description
				margin 8px 0
				color #fff

			> .info
				margin 8px 0

				> p
					display inline
					margin 0 16px 0 0
					color #a9b9c1

					> i
						margin-right 4px

			> .status
				> a
					color #657786

					&:not(:last-child)
						margin-right 16px

					> b
						margin-right 4px
						font-size 16px
						color #fff

					> i
						font-size 14px

	> nav
		position sticky
		top 48px
		box-shadow 0 4px 4px rgba(0, 0, 0, 0.3)
		background-color #313a42
		z-index 1
		> .nav-container
			display flex
			justify-content center
			margin 0 auto
			max-width 600px

			> a
				display block
				flex 1 1
				text-align center
				line-height 52px
				font-size 14px
				text-decoration none
				color #657786
				border-bottom solid 2px transparent

				&[data-is-active]
					font-weight bold
					color $theme-color
					border-color $theme-color

	> .body
		padding 8px

		@media (min-width 500px)
			padding 16px

</style>
