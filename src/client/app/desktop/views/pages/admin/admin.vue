<template>
<div class="mk-admin">
	<nav>
		<ul>
			<li @click="nav('dashboard')" :class="{ active: page == 'dashboard' }">%fa:chalkboard .fw%%i18n:@dashboard%</li>
			<li @click="nav('users')" :class="{ active: page == 'users' }">%fa:users .fw%%i18n:@users%</li>
			<li @click="nav('announcements')" :class="{ active: page == 'announcements' }">%fa:broadcast-tower .fw%%i18n:@announcements%</li>
			<li @click="nav('hashtags')" :class="{ active: page == 'hashtags' }">%fa:hashtag .fw%%i18n:@hashtags%</li>

			<!-- <li @click="nav('drive')" :class="{ active: page == 'drive' }">%fa:cloud .fw%%i18n:@drive%</li> -->
			<!-- <li @click="nav('update')" :class="{ active: page == 'update' }">%i18n:@update%</li> -->
		</ul>
	</nav>
	<main>
		<div v-show="page == 'dashboard'">
			<x-dashboard/>
			<x-charts/>
		</div>
		<div v-show="page == 'announcements'">
			<x-announcements/>
		</div>
		<div v-show="page == 'hashtags'">
			<x-hashtags/>
		</div>
		<div v-if="page == 'users'">
			<x-suspend-user/>
			<x-unsuspend-user/>
			<x-verify-user/>
			<x-unverify-user/>
		</div>
		<div v-if="page == 'drive'"></div>
		<div v-if="page == 'update'"></div>
	</main>
</div>
</template>

<script lang="ts">
import Vue from "vue";
import XDashboard from "./admin.dashboard.vue";
import XAnnouncements from "./admin.announcements.vue";
import XHashtags from "./admin.hashtags.vue";
import XSuspendUser from "./admin.suspend-user.vue";
import XUnsuspendUser from "./admin.unsuspend-user.vue";
import XVerifyUser from "./admin.verify-user.vue";
import XUnverifyUser from "./admin.unverify-user.vue";
import XCharts from "../../components/charts.vue";

export default Vue.extend({
	components: {
		XDashboard,
		XAnnouncements,
		XHashtags,
		XSuspendUser,
		XUnsuspendUser,
		XVerifyUser,
		XUnverifyUser,
		XCharts
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
@import '~const.styl'

.mk-admin
	display flex
	height 100%
	margin 32px

	> nav
		flex 0 0 250px
		width 100%
		height 100%
		padding 16px 0 0 0
		overflow auto
		border-right solid 1px #ddd

		> ul
			list-style none

			> li
				display block
				padding 10px 16px
				margin 0
				color #666
				cursor pointer
				user-select none
				transition margin-left 0.2s ease

				> [data-fa]
					margin-right 4px


				&:hover
					color #555

				&.active
					margin-left 8px
					color $theme-color !important

	> main
		width 100%
		padding 16px 32px

		> div
			> div
				max-width 800px

.mk-admin-card
	padding 32px
	background #fff
	box-shadow 0 2px 8px rgba(#000, 0.1)

	&:not(:last-child)
		margin-bottom 16px

	> header
		margin 0 0 1em 0
		padding 0 0 8px 0
		font-size 1em
		color #555
		border-bottom solid 1px #eee

</style>
