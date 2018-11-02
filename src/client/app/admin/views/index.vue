<template>
<div class="mk-admin">
	<nav>
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
			page: 'dashboard'
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
		padding 16px 0 0 0
		overflow auto
		background #333
		color #fff

		> ul
			margin 0
			padding 0
			list-style none

			> li
				display block
				padding 10px 16px
				margin 0
				cursor pointer
				user-select none
				transition margin-left 0.2s ease

				> [data-fa]
					margin-right 4px

				&.active
					margin-left 8px
					color var(--primary) !important

	> main
		width 100%
		padding 32px 32px 32px calc(32px + 250px)

</style>
