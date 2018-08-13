<template>
<div class="mk-admin">
	<nav>
		<ul>
			<li @click="nav('dashboard')" :class="{ active: page == 'dashboard' }">%fa:chalkboard .fw%%i18n:@dashboard%</li>
			<!-- <li @click="nav('users')" :class="{ active: page == 'users' }">%fa:users .fw%%i18n:@users%</li> -->
			<!-- <li @click="nav('drive')" :class="{ active: page == 'drive' }">%fa:cloud .fw%%i18n:@drive%</li> -->
			<!-- <li @click="nav('update')" :class="{ active: page == 'update' }">%i18n:@update%</li> -->
		</ul>
	</nav>
	<main>
		<div v-if="page == 'dashboard'">
			<x-dashboard/>
		</div>
		<div v-if="page == 'users'">
			<x-suspend-user/>
		</div>
		<div v-if="page == 'drive'"></div>
		<div v-if="page == 'update'"></div>
	</main>
</div>
</template>

<script lang="ts">
import Vue from "vue";
import XDashboard from "./admin.dashboard.vue";
import XSuspendUser from "./admin.suspend-user.vue";

export default Vue.extend({
	components: {
		XDashboard,
		XSuspendUser
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

<style lang="stylus" scoped>
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

</style>
