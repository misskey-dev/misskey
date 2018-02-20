<template>
<div class="mk-settings">
	<div class="nav">
		<p :class="{ active: page == 'profile' }" @mousedown="page = 'profile'">%fa:user .fw%%i18n:desktop.tags.mk-settings.profile%</p>
		<p :class="{ active: page == 'web' }" @mousedown="page = 'web'">%fa:desktop .fw%Web</p>
		<p :class="{ active: page == 'notification' }" @mousedown="page = 'notification'">%fa:R bell .fw%通知</p>
		<p :class="{ active: page == 'drive' }" @mousedown="page = 'drive'">%fa:cloud .fw%%i18n:desktop.tags.mk-settings.drive%</p>
		<p :class="{ active: page == 'mute' }" @mousedown="page = 'mute'">%fa:ban .fw%%i18n:desktop.tags.mk-settings.mute%</p>
		<p :class="{ active: page == 'apps' }" @mousedown="page = 'apps'">%fa:puzzle-piece .fw%アプリ</p>
		<p :class="{ active: page == 'twitter' }" @mousedown="page = 'twitter'">%fa:B twitter .fw%Twitter</p>
		<p :class="{ active: page == 'security' }" @mousedown="page = 'security'">%fa:unlock-alt .fw%%i18n:desktop.tags.mk-settings.security%</p>
		<p :class="{ active: page == 'api' }" @mousedown="page = 'api'">%fa:key .fw%API</p>
		<p :class="{ active: page == 'other' }" @mousedown="page = 'other'">%fa:cogs .fw%%i18n:desktop.tags.mk-settings.other%</p>
	</div>
	<div class="pages">
		<section class="profile" v-show="page == 'profile'">
			<h1>%i18n:desktop.tags.mk-settings.profile%</h1>
			<x-profile/>
		</section>

		<section class="web" v-show="page == 'web'">
			<h1>デザイン</h1>
			<a href="/i/customize-home" class="ui button">ホームをカスタマイズ</a>
		</section>

		<section class="drive" v-show="page == 'drive'">
			<h1>%i18n:desktop.tags.mk-settings.drive%</h1>
			<mk-drive-setting/>
		</section>

		<section class="mute" v-show="page == 'mute'">
			<h1>%i18n:desktop.tags.mk-settings.mute%</h1>
			<mk-mute-setting/>
		</section>

		<section class="apps" v-show="page == 'apps'">
			<h1>アプリケーション</h1>
			<mk-authorized-apps/>
		</section>

		<section class="twitter" v-show="page == 'twitter'">
			<h1>Twitter</h1>
			<mk-twitter-setting/>
		</section>

		<section class="password" v-show="page == 'security'">
			<h1>%i18n:desktop.tags.mk-settings.password%</h1>
			<mk-password-setting/>
		</section>

		<section class="2fa" v-show="page == 'security'">
			<h1>%i18n:desktop.tags.mk-settings.2fa%</h1>
			<mk-2fa-setting/>
		</section>

		<section class="signin" v-show="page == 'security'">
			<h1>サインイン履歴</h1>
			<mk-signin-history/>
		</section>

		<section class="api" v-show="page == 'api'">
			<h1>API</h1>
			<mk-api-info/>
		</section>

		<section class="other" v-show="page == 'other'">
			<h1>%i18n:desktop.tags.mk-settings.license%</h1>
			%license%
		</section>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XProfile from './settings.profile.vue';

export default Vue.extend({
	components: {
		XProfile
	},
	data() {
		return {
			page: 'profile'
		};
	}
});
</script>

<style lang="stylus" scoped>
.mk-settings
	display flex
	width 100%
	height 100%

	> .nav
		flex 0 0 200px
		width 100%
		height 100%
		padding 16px 0 0 0
		overflow auto
		border-right solid 1px #ddd

		> p
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

	> .pages
		width 100%
		height 100%
		flex auto
		overflow auto

		> section
			margin 32px
			color #4a535a

			> h1
				display block
				margin 0 0 1em 0
				padding 0 0 8px 0
				font-size 1em
				color #555
				border-bottom solid 1px #eee

</style>
