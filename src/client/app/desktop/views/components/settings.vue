<template>
<div class="mk-settings">
	<div class="nav" :class="{ inWindow }">
		<p :class="{ active: page == 'profile' }" @mousedown="page = 'profile'"><fa icon="user" fixed-width/>{{ $t('@._settings.profile') }}</p>
		<p :class="{ active: page == 'appearance' }" @mousedown="page = 'appearance'"><fa icon="palette" fixed-width/>{{ $t('@._settings.appearance') }}</p>
		<p :class="{ active: page == 'behavior' }" @mousedown="page = 'behavior'"><fa icon="desktop" fixed-width/>{{ $t('@._settings.behavior') }}</p>
		<p :class="{ active: page == 'notification' }" @mousedown="page = 'notification'"><fa :icon="['far', 'bell']" fixed-width/>{{ $t('@._settings.notification') }}</p>
		<p :class="{ active: page == 'drive' }" @mousedown="page = 'drive'"><fa icon="cloud" fixed-width/>{{ $t('@.drive') }}</p>
		<p :class="{ active: page == 'hashtags' }" @mousedown="page = 'hashtags'"><fa icon="hashtag" fixed-width/>{{ $t('@._settings.tags') }}</p>
		<p :class="{ active: page == 'muteAndBlock' }" @mousedown="page = 'muteAndBlock'"><fa icon="ban" fixed-width/>{{ $t('@._settings.mute-and-block') }}</p>
		<p :class="{ active: page == 'apps' }" @mousedown="page = 'apps'"><fa icon="puzzle-piece" fixed-width/>{{ $t('@._settings.apps') }}</p>
		<p :class="{ active: page == 'security' }" @mousedown="page = 'security'"><fa icon="unlock-alt" fixed-width/>{{ $t('@._settings.security') }}</p>
		<p :class="{ active: page == 'api' }" @mousedown="page = 'api'"><fa icon="key" fixed-width/>API</p>
		<p :class="{ active: page == 'other' }" @mousedown="page = 'other'"><fa icon="cogs" fixed-width/>{{ $t('@._settings.other') }}</p>
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
		initialPage: {
			type: String,
			required: false
		},
		inWindow: {
			type: Boolean,
			required: false,
			default: true
		}
	},
	data() {
		return {
			page: this.initialPage || 'profile',
		};
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

		> p
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
		background var(--bg)

</style>
