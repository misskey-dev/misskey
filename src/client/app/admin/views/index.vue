<template>
<div class="mk-admin">
	<nav>
		<div class="me">
			<img class="avatar" :src="$store.state.i.avatarUrl" alt="avatar"/>
			<p class="name">{{ $store.state.i | userName }}</p>
		</div>
		<ul>
			<li @click="nav('dashboard')" :class="{ active: page == 'dashboard' }">%fa:home .fw%%i18n:@dashboard%</li>
			<li @click="nav('instance')" :class="{ active: page == 'instance' }">%fa:cog .fw%%i18n:@instance%</li>
			<li @click="nav('users')" :class="{ active: page == 'users' }">%fa:users .fw%%i18n:@users%</li>
			<li @click="nav('emoji')" :class="{ active: page == 'emoji' }">%fa:grin R .fw%%i18n:@emoji%</li>
			<li @click="nav('announcements')" :class="{ active: page == 'announcements' }">%fa:broadcast-tower .fw%%i18n:@announcements%</li>
			<li @click="nav('hashtags')" :class="{ active: page == 'hashtags' }">%fa:hashtag .fw%%i18n:@hashtags%</li>

			<!-- <li @click="nav('drive')" :class="{ active: page == 'drive' }">%fa:cloud .fw%%i18n:common.drive%</li> -->
			<!-- <li @click="nav('update')" :class="{ active: page == 'update' }">%i18n:@update%</li> -->
		</ul>
		<div class="version">
			<small>Misskey {{ version }}</small>
		</div>
	</nav>
	<main>
		<div v-show="page == 'dashboard'"><x-dashboard/></div>
		<div v-show="page == 'instance'"><x-instance/></div>
		<div v-if="page == 'users'"><x-users/></div>
		<div v-show="page == 'emoji'"><x-emoji/></div>
		<div v-show="page == 'announcements'"><x-announcements/></div>
		<div v-show="page == 'hashtags'"><x-hashtags/></div>
		<div v-if="page == 'drive'"></div>
		<div v-if="page == 'update'"></div>
	</main>
</div>
</template>

<script lang="ts">
import Vue from "vue";
import { version } from '../../config';
import XDashboard from "./dashboard.vue";
import XInstance from "./instance.vue";
import XEmoji from "./emoji.vue";
import XAnnouncements from "./announcements.vue";
import XHashtags from "./hashtags.vue";
import XUsers from "./users.vue";

export default Vue.extend({
	components: {
		XDashboard,
		XInstance,
		XEmoji,
		XAnnouncements,
		XHashtags,
		XUsers
	},
	data() {
		return {
			page: 'dashboard',
			version
		};
	},
	methods: {
		nav(page: string) {
			this.page = page;
		}
	}
});
</script>

<style lang="stylus">
.mk-admin
	display flex
	height 100%

	> nav
		position fixed
		z-index 10000
		top 0
		left 0
		width 250px
		height 100vh
		overflow auto
		background #333
		color #fff

		> .me
			display flex
			margin 16px
			padding-bottom 16px
			align-items center
			border-bottom solid 1px #555

			> .avatar
				height 48px
				border-radius 100%
				vertical-align middle

			> .name
				margin 0 16px
				padding 0
				color #fff
				overflow hidden
				text-overflow ellipsis
				white-space nowrap
				font-size 15px

		> .version
			margin 16px
			padding-top 16px
			border-top solid 1px #555
			text-align center

			> small
				opacity 0.7

		> ul
			margin 0
			padding 0
			list-style none
			font-size 15px

			> li
				display block
				padding 10px 16px
				margin 0
				cursor pointer
				user-select none
				color #eee
				transition margin-left 0.2s ease

				&:hover
					color #fff

				> [data-fa]
					margin-right 6px

				&.active
					margin-left 8px
					color var(--primary) !important

					&:after
						content ""
						display block
						position absolute
						top 0
						right 0
						bottom 0
						margin auto 0
						height 0
						border-top solid 16px transparent
						border-right solid 16px #EBEBEB
						border-bottom solid 16px transparent
						border-left solid 16px transparent

	> main
		width 100%
		padding 32px 32px 32px calc(32px + 250px)
		max-width 1300px

</style>
