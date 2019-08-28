<template>
<div class="mk-settings">
	<div class="nav" :class="{ inWindow }">
		<router-link to="/i/settings/profile" active-class="active"><fa icon="user" fixed-width/>{{ $t('@._settings.profile') }}</router-link>
		<router-link to="/i/settings/appearance" active-class="active"><fa icon="palette" fixed-width/>{{ $t('@._settings.appearance') }}</router-link>
		<router-link to="/i/settings/behavior" active-class="active"><fa icon="desktop" fixed-width/>{{ $t('@._settings.behavior') }}</router-link>
		<router-link to="/i/settings/notification" active-class="active"><fa :icon="['far', 'bell']" fixed-width/>{{ $t('@._settings.notification') }}</router-link>
		<router-link to="/i/settings/drive" active-class="active"><fa icon="cloud" fixed-width/>{{ $t('@.drive') }}</router-link>
		<router-link to="/i/settings/hashtags" active-class="active"><fa icon="hashtag" fixed-width/>{{ $t('@._settings.tags') }}</router-link>
		<router-link to="/i/settings/muteAndBlock" active-class="active"><fa icon="ban" fixed-width/>{{ $t('@._settings.mute-and-block') }}</router-link>
		<router-link to="/i/settings/apps" active-class="active"><fa icon="puzzle-piece" fixed-width/>{{ $t('@._settings.apps') }}</router-link>
		<router-link to="/i/settings/security" active-class="active"><fa icon="unlock-alt" fixed-width/>{{ $t('@._settings.security') }}</router-link>
		<router-link to="/i/settings/api" active-class="active"><fa icon="key" fixed-width/>API</router-link>
		<router-link to="/i/settings/other" active-class="active"><fa icon="cogs" fixed-width/>{{ $t('@._settings.other') }}</router-link>
	</div>
	<div class="pages">
		<x-settings :page="page"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import XSettings from '../../../common/views/components/settings/settings.vue';

export default Vue.extend({
	i18n: i18n(),
	components: {
		XSettings,
	},
	props: {
		page: {
			type: String,
			required: true,
		},
		inWindow: {
			type: Boolean,
			required: false,
			default: true
		}
	},
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
		z-index 1
		font-size 15px

		> a
			display block
			padding 10px 16px
			margin 0
			color var(--desktopSettingsNavItem)
			cursor pointer
			user-select none
			transition margin-left 0.2s ease

			> [data-icon]
				margin-right 4px

			&:hover
				color var(--desktopSettingsNavItemHover)

			&.active
				margin-left 8px
				color var(--primary) !important

	> .pages
		width 100%
		height 100%
		flex auto
		overflow auto

</style>
