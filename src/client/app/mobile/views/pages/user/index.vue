<template>
<mk-ui>
	<template #header v-if="!fetching">
		<img :src="avator" alt=""><mk-user-name :user="user" :key="user.id"/>
	</template>
	<div class="wwtwuxyh" v-if="!fetching">
		<div class="is-suspended" v-if="user.isSuspended"><p><fa icon="exclamation-triangle"/> {{ $t('@.user-suspended') }}</p></div>
		<div class="is-remote" v-if="user.host != null"><p><fa icon="exclamation-triangle"/> {{ $t('@.is-remote-user') }}<a :href="user.url || user.uri" target="_blank">{{ $t('@.view-on-remote') }}</a></p></div>
		<header>
			<div class="banner" :style="style"></div>
			<div class="body">
				<div class="top">
					<a class="avatar">
						<img :src="avator" alt="avatar"/>
					</a>
					<button class="menu" ref="menu" @click="menu"><fa icon="ellipsis-h"/></button>
					<mk-follow-button v-if="$store.getters.isSignedIn && $store.state.i.id != user.id" :user="user"/>
				</div>
				<div class="title">
					<h1><mk-user-name :user="user" :key="user.id"/></h1>
					<span class="username"><mk-acct :user="user" :detail="true" /></span>
					<span class="followed" v-if="user.isFollowed">{{ $t('follows-you') }}</span>
				</div>
				<div class="description">
					<mfm v-if="user.description" :text="user.description" :is-note="false" :author="user" :i="$store.state.i" :custom-emojis="user.emojis" :key="user.id"/>
					<x-integrations :user="user" style="margin:20px 0;"/>
				</div>
				<div class="fields" v-if="user.fields">
					<dl class="field" v-for="(field, i) in user.fields" :key="i">
						<dt class="name">
							<mfm :text="field.name" :should-break="false" :plain-text="true" :custom-emojis="user.emojis"/>
						</dt>
						<dd class="value">
							<mfm :text="field.value" :author="user" :i="$store.state.i" :custom-emojis="user.emojis"/>
						</dd>
					</dl>
				</div>
				<div class="info">
					<p class="location" v-if="user.host === null && user.profile.location">
						<fa icon="map-marker"/>{{ user.profile.location }}
					</p>
					<p class="birthday" v-if="user.host === null && user.profile.birthday">
						<fa icon="birthday-cake"/>{{ user.profile.birthday.replace('-', '年').replace('-', '月') + '日' }} ({{ $t('years-old', { age }) }})
					</p>
				</div>
				<div class="status">
					<router-link :to="user | userPage()">
						<b>{{ user.notesCount | number }}</b>
						<i>{{ $t('notes') }}</i>
					</router-link>
					<router-link :to="user | userPage('following')">
						<b>{{ user.followingCount | number }}</b>
						<i>{{ $t('following') }}</i>
					</router-link>
					<router-link :to="user | userPage('followers')">
						<b>{{ user.followersCount | number }}</b>
						<i>{{ $t('followers') }}</i>
					</router-link>
				</div>
			</div>
		</header>
		<nav v-if="$route.name == 'user'" :class="{ shadow: $store.state.device.useShadow }">
			<div class="nav-container">
				<a :data-active="page == 'home'" @click="page = 'home'"><fa icon="home"/> {{ $t('overview') }}</a>
				<a :data-active="page == 'notes'" @click="page = 'notes'"><fa :icon="['far', 'comment-alt']"/> {{ $t('timeline') }}</a>
				<a :data-active="page == 'media'" @click="page = 'media'"><fa icon="image"/> {{ $t('media') }}</a>
			</div>
		</nav>
		<main>
			<template v-if="$route.name == 'user'">
				<x-home v-if="page == 'home'" :user="user" :key="user.id"/>
				<mk-user-timeline v-if="page == 'notes'" :user="user" :key="`tl:${user.id}`"/>
				<mk-user-timeline v-if="page == 'media'" :user="user" :with-media="true" :key="`media:${user.id}`"/>
			</template>
			<router-view :user="user"></router-view>
		</main>
	</div>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import * as age from 's-age';
import parseAcct from '../../../../../../misc/acct/parse';
import Progress from '../../../../common/scripts/loading';
import XUserMenu from '../../../../common/views/components/user-menu.vue';
import XHome from './home.vue';
import { getStaticImageUrl } from '../../../../common/scripts/get-static-image-url';
import XIntegrations from '../../../../common/views/components/integrations.vue';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/user.vue'),
	components: {
		XHome,
		XIntegrations
	},
	data() {
		return {
			fetching: true,
			user: null,
			page: this.$route.name == 'user' ? 'home' : null
		};
	},
	computed: {
		age(): number {
			return age(this.user.profile.birthday);
		},
		avator(): string {
			return this.$store.state.device.disableShowingAnimatedImages
				? getStaticImageUrl(this.user.avatarUrl)
				: this.user.avatarUrl;
		},
		style(): any {
			if (this.user.bannerUrl == null) return {};
			return {
				backgroundColor: this.user.bannerColor && this.user.bannerColor.length == 3 ? `rgb(${ this.user.bannerColor.join(',') })` : null,
				backgroundImage: `url(${ this.user.bannerUrl })`
			};
		}
	},
	watch: {
		$route: 'fetch'
	},
	created() {
		this.fetch();
	},
	methods: {
		fetch() {
			Progress.start();

			this.$root.api('users/show', parseAcct(this.$route.params.user)).then(user => {
				this.user = user;
				this.fetching = false;

				Progress.done();
				document.title = `${Vue.filter('userName')(this.user)} | ${this.$root.instanceName}`;
			});
		},

		menu() {
			this.$root.new(XUserMenu, {
				source: this.$refs.menu,
				user: this.user
			});
		},
	}
});
</script>

<style lang="stylus" scoped>
.wwtwuxyh
	$bg = var(--face)

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
			padding 14px
			max-width 600px
			font-size 14px

			> a
				font-weight bold

			@media (max-width 500px)
				padding 12px
				font-size 12px

	> header
		background $bg

		> .banner
			padding-bottom 33.3%
			background-color rgba(0, 0, 0, 0.1)
			background-size cover
			background-position center

		> .body
			padding 12px
			margin 0 auto
			max-width 600px

			> .top
				display flex

				> .avatar
					display block
					width 25%
					height 40px

					> img
						display block
						position absolute
						left -2px
						bottom -2px
						width 100%
						background $bg
						border 3px solid $bg
						border-radius 6px

						@media (min-width 500px)
							left -4px
							bottom -4px
							border 4px solid $bg
							border-radius 12px

				> .menu
					margin 0 0 0 auto
					padding 8px
					margin-right 8px
					font-size 18px
					color var(--text)

			> .title
				margin 8px 0

				> h1
					margin 0
					line-height 22px
					font-size 20px
					color var(--mobileUserPageName)

				> .username
					display inline-block
					line-height 20px
					font-size 16px
					font-weight bold
					color var(--mobileUserPageAcct)

				> .followed
					margin-left 8px
					padding 2px 4px
					font-size 12px
					color var(--mobileUserPageFollowedFg)
					background var(--mobileUserPageFollowedBg)
					border-radius 4px

			> .description
				margin 8px 0
				color var(--mobileUserPageDescription)

				@media (max-width 450px)
					font-size 15px

			> .fields
				margin 8px 0

				> .field
					display flex
					padding 0
					margin 0
					align-items center

					> .name
						padding 4px
						margin 4px
						width 30%
						overflow hidden
						white-space nowrap
						text-overflow ellipsis
						font-weight bold
						color var(--mobileUserPageStatusHighlight)

					> .value
						padding 4px
						margin 4px
						width 70%
						overflow hidden
						white-space nowrap
						text-overflow ellipsis
						color var(--mobileUserPageStatusHighlight)

			> .info
				margin 8px 0

				@media (max-width 450px)
					font-size 15px

				> p
					display inline
					margin 0 16px 0 0
					color var(--text)

					> i
						margin-right 4px

			> .status
				> a
					color var(--text)

					&:not(:last-child)
						margin-right 16px

					> b
						margin-right 4px
						font-size 16px
						color var(--mobileUserPageStatusHighlight)

					> i
						font-size 14px

				> button
					color var(--text)

	> nav
		position -webkit-sticky
		position sticky
		top 47px
		background-color $bg
		z-index 2

		&.shadow
			box-shadow 0 4px 4px var(--mobileUserPageHeaderShadow)

		> .nav-container
			display flex
			justify-content center
			margin 0 auto
			max-width 616px

			> a
				display block
				flex 1 1
				text-align center
				line-height 48px
				font-size 12px
				text-decoration none
				color var(--text)
				border-bottom solid 2px transparent

				@media (min-width 400px)
					line-height 52px
					font-size 14px

				&[data-active]
					font-weight bold
					color var(--primary)
					border-color var(--primary)

</style>
