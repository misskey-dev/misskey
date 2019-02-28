<template>
<div class="mk-settings">
	<div class="nav" :class="{ inWindow }">
		<p :class="{ active: page == 'profile' }" @mousedown="page = 'profile'"><fa icon="user" fixed-width/>{{ $t('profile') }}</p>
		<p :class="{ active: page == 'theme' }" @mousedown="page = 'theme'"><fa icon="palette" fixed-width/>{{ $t('theme') }}</p>
		<p :class="{ active: page == 'web' }" @mousedown="page = 'web'"><fa icon="desktop" fixed-width/>Web</p>
		<p :class="{ active: page == 'notification' }" @mousedown="page = 'notification'"><fa :icon="['far', 'bell']" fixed-width/>{{ $t('notification') }}</p>
		<p :class="{ active: page == 'drive' }" @mousedown="page = 'drive'"><fa icon="cloud" fixed-width/>{{ $t('@.drive') }}</p>
		<p :class="{ active: page == 'hashtags' }" @mousedown="page = 'hashtags'"><fa icon="hashtag" fixed-width/>{{ $t('tags') }}</p>
		<p :class="{ active: page == 'muteAndBlock' }" @mousedown="page = 'muteAndBlock'"><fa icon="ban" fixed-width/>{{ $t('mute-and-block') }}</p>
		<p :class="{ active: page == 'apps' }" @mousedown="page = 'apps'"><fa icon="puzzle-piece" fixed-width/>{{ $t('apps') }}</p>
		<p :class="{ active: page == 'security' }" @mousedown="page = 'security'"><fa icon="unlock-alt" fixed-width/>{{ $t('security') }}</p>
		<p :class="{ active: page == 'api' }" @mousedown="page = 'api'"><fa icon="key" fixed-width/>API</p>
		<p :class="{ active: page == 'other' }" @mousedown="page = 'other'"><fa icon="cogs" fixed-width/>{{ $t('other') }}</p>
	</div>
	<div class="pages">
		<div class="profile" v-show="page == 'profile'">
			<x-profile-editor/>
			<x-integration-settings/>
		</div>

		<x-theme class="theme" v-show="page == 'theme'"/>

		<ui-card class="web" v-show="page == 'web'">
			<template #title><fa icon="sliders-h"/> {{ $t('behaviour') }}</template>

			<section>
				<ui-switch v-model="fetchOnScroll">{{ $t('fetch-on-scroll') }}
					<template #desc>{{ $t('fetch-on-scroll-desc') }}</template>
				</ui-switch>
				<ui-switch v-model="autoPopout">{{ $t('auto-popout') }}
					<template #desc>{{ $t('auto-popout-desc') }}</template>
				</ui-switch>
				<ui-switch v-model="keepCw">{{ $t('keep-cw') }}
					<template #desc>{{ $t('keep-cw-desc') }}</template>
				</ui-switch>
			</section>

			<section>
				<header>{{ $t('timeline') }}</header>
				<ui-switch v-model="showMyRenotes">{{ $t('show-my-renotes') }}</ui-switch>
				<ui-switch v-model="showRenotedMyNotes">{{ $t('show-renoted-my-notes') }}</ui-switch>
				<ui-switch v-model="showLocalRenotes">{{ $t('show-local-renotes') }}</ui-switch>
			</section>

			<section>
				<header>{{ $t('note-visibility') }}</header>
				<ui-switch v-model="rememberNoteVisibility">{{ $t('remember-note-visibility') }}</ui-switch>
				<section>
					<header>{{ $t('default-note-visibility') }}</header>
					<ui-select v-model="defaultNoteVisibility">
						<option value="public">{{ $t('@.note-visibility.public') }}</option>
						<option value="home">{{ $t('@.note-visibility.home') }}</option>
						<option value="followers">{{ $t('@.note-visibility.followers') }}</option>
						<option value="specified">{{ $t('@.note-visibility.specified') }}</option>
						<option value="local-public">{{ $t('@.note-visibility.local-public') }}</option>
						<option value="local-home">{{ $t('@.note-visibility.local-home') }}</option>
						<option value="local-followers">{{ $t('@.note-visibility.local-followers') }}</option>
					</ui-select>
				</section>
			</section>

			<section>
				<header>{{ $t('web-search-engine') }}</header>
				<ui-input v-model="webSearchEngine">{{ $t('web-search-engine') }}<template #desc>{{ $t('web-search-engine-desc') }}</template></ui-input>
			</section>
		</ui-card>

		<ui-card class="web" v-show="page == 'web'">
			<template #title><fa icon="desktop"/> {{ $t('display') }}</template>

			<section>
				<ui-switch v-model="showPostFormOnTopOfTl">{{ $t('post-form-on-timeline') }}</ui-switch>
				<ui-button @click="customizeHome">{{ $t('@.customize-home') }}</ui-button>
			</section>
			<section>
				<header>{{ $t('wallpaper') }}</header>
				<ui-horizon-group class="fit-bottom">
					<ui-button @click="updateWallpaper">{{ $t('choose-wallpaper') }}</ui-button>
					<ui-button @click="deleteWallpaper">{{ $t('delete-wallpaper') }}</ui-button>
				</ui-horizon-group>
			</section>
			<section>
				<header>{{ $t('navbar-position') }}</header>
				<ui-radio v-model="navbar" value="top">{{ $t('navbar-position-top') }}</ui-radio>
				<ui-radio v-model="navbar" value="left">{{ $t('navbar-position-left') }}</ui-radio>
				<ui-radio v-model="navbar" value="right">{{ $t('navbar-position-right') }}</ui-radio>
			</section>
			<section>
				<ui-switch v-model="darkmode">{{ $t('@.dark-mode') }}</ui-switch>
				<ui-switch v-model="useShadow">{{ $t('@.use-shadow') }}</ui-switch>
				<ui-switch v-model="roundedCorners">{{ $t('@.rounded-corners') }}</ui-switch>
				<ui-switch v-model="circleIcons">{{ $t('@.circle-icons') }}</ui-switch>
				<section>
					<header>{{ $t('@.line-width') }}</header>
					<ui-radio v-model="lineWidth" :value="0.5">{{ $t('@.line-width-thin') }}</ui-radio>
					<ui-radio v-model="lineWidth" :value="1">{{ $t('@.line-width-normal') }}</ui-radio>
					<ui-radio v-model="lineWidth" :value="2">{{ $t('@.line-width-thick') }}</ui-radio>
				</section>
				<ui-switch v-model="reduceMotion">{{ $t('@.reduce-motion') }}</ui-switch>
				<ui-switch v-model="contrastedAcct">{{ $t('@.contrasted-acct') }}</ui-switch>
				<ui-switch v-model="showFullAcct">{{ $t('@.show-full-acct') }}</ui-switch>
				<ui-switch v-model="showVia">{{ $t('@.show-via') }}</ui-switch>
				<ui-switch v-model="useOsDefaultEmojis">{{ $t('@.use-os-default-emojis') }}</ui-switch>
				<ui-switch v-model="iLikeSushi">{{ $t('@.i-like-sushi') }}</ui-switch>
			</section>
			<section>
				<ui-switch v-model="suggestRecentHashtags">{{ $t('@.suggest-recent-hashtags') }}</ui-switch>
				<ui-switch v-model="showClockOnHeader">{{ $t('show-clock-on-header') }}</ui-switch>
				<ui-switch v-model="alwaysShowNsfw">{{ $t('@.always-show-nsfw') }}</ui-switch>
				<ui-switch v-model="showReplyTarget">{{ $t('show-reply-target') }}</ui-switch>
				<ui-switch v-model="showMaps">{{ $t('show-maps') }}</ui-switch>
				<ui-switch v-model="disableAnimatedMfm">{{ $t('@.disable-animated-mfm') }}</ui-switch>
				<ui-switch v-model="disableShowingAnimatedImages">{{ $t('@.disable-showing-animated-images') }}</ui-switch>
				<ui-switch v-model="remainDeletedNote">{{ $t('remain-deleted-note') }}</ui-switch>
			</section>
			<section>
				<header>{{ $t('@.deck-column-align') }}</header>
				<ui-radio v-model="deckColumnAlign" value="center">{{ $t('@.deck-column-align-center') }}</ui-radio>
				<ui-radio v-model="deckColumnAlign" value="left">{{ $t('@.deck-column-align-left') }}</ui-radio>
				<ui-radio v-model="deckColumnAlign" value="flexible">{{ $t('@.deck-column-align-flexible') }}</ui-radio>
			</section>
			<section>
				<header>{{ $t('@.deck-column-width') }}</header>
				<ui-radio v-model="deckColumnWidth" value="narrow">{{ $t('@.deck-column-width-narrow') }}</ui-radio>
				<ui-radio v-model="deckColumnWidth" value="narrower">{{ $t('@.deck-column-width-narrower') }}</ui-radio>
				<ui-radio v-model="deckColumnWidth" value="normal">{{ $t('@.deck-column-width-normal') }}</ui-radio>
				<ui-radio v-model="deckColumnWidth" value="wider">{{ $t('@.deck-column-width-wider') }}</ui-radio>
				<ui-radio v-model="deckColumnWidth" value="wide">{{ $t('@.deck-column-width-wide') }}</ui-radio>
			</section>
			<section>
				<ui-switch v-model="games_reversi_showBoardLabels">{{ $t('@.show-reversi-board-labels') }}</ui-switch>
				<ui-switch v-model="games_reversi_useAvatarStones">{{ $t('@.use-avatar-reversi-stones') }}</ui-switch>
			</section>
		</ui-card>

		<ui-card class="web" v-show="page == 'web'">
			<template #title><fa icon="volume-up"/> {{ $t('sound') }}</template>

			<section>
				<ui-switch v-model="enableSounds">{{ $t('enable-sounds') }}
					<template #desc>{{ $t('enable-sounds-desc') }}</template>
				</ui-switch>
				<label>{{ $t('volume') }}</label>
				<input type="range"
					v-model="soundVolume"
					:disabled="!enableSounds"
					max="1"
					step="0.1"
				/>
				<ui-button @click="soundTest"><fa icon="volume-up"/> {{ $t('test') }}</ui-button>
			</section>
		</ui-card>

		<x-language-settings v-show="page == 'web'"/>

		<ui-card class="web" v-show="page == 'web'">
			<template #title><fa :icon="['far', 'trash-alt']"/> {{ $t('cache') }}</template>
			<section>
				<ui-button @click="clean">{{ $t('clean-cache') }}</ui-button>
				<div class="none ui info warn">
					<p><fa icon="exclamation-triangle"/>{{ $t('cache-warn') }}</p>
				</div>
			</section>
		</ui-card>

		<x-notification-settings v-show="page == 'notification'"/>

		<div class="drive" v-if="page == 'drive'">
			<x-drive-settings/>
		</div>

		<ui-card class="hashtags" v-show="page == 'hashtags'">
			<template #title><fa icon="hashtag"/> {{ $t('tags') }}</template>
			<section>
				<x-tags/>
			</section>
		</ui-card>

		<div class="muteAndBlock" v-show="page == 'muteAndBlock'">
			<x-mute-and-block/>
		</div>

		<ui-card class="apps" v-show="page == 'apps'">
			<template #title><fa icon="puzzle-piece"/> {{ $t('apps') }}</template>
			<section>
				<x-apps/>
			</section>
		</ui-card>

		<ui-card class="password" v-show="page == 'security'">
			<template #title><fa icon="unlock-alt"/> {{ $t('password') }}</template>
			<section>
				<x-password-settings/>
			</section>
		</ui-card>

		<ui-card class="2fa" v-show="page == 'security'">
			<template #title><fa icon="mobile-alt"/> {{ $t('@.2fa') }}</template>
			<section>
				<x-2fa/>
			</section>
		</ui-card>

		<ui-card class="signin" v-show="page == 'security'">
			<template #title><fa icon="sign-in-alt"/> {{ $t('signin') }}</template>
			<section>
				<x-signins/>
			</section>
		</ui-card>

		<div class="api" v-show="page == 'api'">
			<x-api-settings/>
		</div>

		<ui-card class="other" v-show="page == 'other'">
			<template #title><fa icon="info-circle"/> {{ $t('about') }}</template>
			<section>
				<p v-if="meta">{{ $t('operator') }}: <i><a :href="'mailto:' + meta.maintainer.email" target="_blank">{{ meta.maintainer.name }}</a></i></p>
			</section>
		</ui-card>

		<ui-card class="other" v-show="page == 'other'">
			<template #title><fa icon="sync-alt"/> {{ $t('update') }}</template>
			<section>
				<p>
					<span>{{ $t('version') }} <i>{{ version }}</i></span>
					<template v-if="latestVersion !== undefined">
						<br>
						<span>{{ $t('latest-version') }} <i>{{ latestVersion ? latestVersion : version }}</i></span>
					</template>
				</p>
				<button class="ui button block" @click="checkForUpdate" :disabled="checkingForUpdate">
					<template v-if="checkingForUpdate">{{ $t('update-checking') }}<mk-ellipsis/></template>
					<template v-else>{{ $t('do-update') }}</template>
				</button>
				<details>
					<summary>{{ $t('update-settings') }}</summary>
					<ui-switch v-model="preventUpdate">
						{{ $t('prevent-update') }}<template #desc>{{ $t('prevent-update-desc') }}</template>
					</ui-switch>
				</details>
			</section>
		</ui-card>

		<ui-card class="other" v-show="page == 'other'">
			<template #title><fa icon="cogs"/> {{ $t('advanced-settings') }}</template>
			<section>
				<ui-switch v-model="debug">
					{{ $t('debug-mode') }}<template #desc>{{ $t('debug-mode-desc') }}</template>
				</ui-switch>
				<ui-switch v-model="enableExperimentalFeatures">
					{{ $t('experimental') }}<template #desc>{{ $t('experimental-desc') }}</template>
				</ui-switch>
			</section>
		</ui-card>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import X2fa from './settings.2fa.vue';
import XApps from './settings.apps.vue';
import XSignins from './settings.signins.vue';
import XTags from './settings.tags.vue';
import XIntegrationSettings from '../../../common/views/components/integration-settings.vue';
import XTheme from '../../../common/views/components/theme.vue';
import XDriveSettings from '../../../common/views/components/drive-settings.vue';
import XMuteAndBlock from '../../../common/views/components/mute-and-block.vue';
import XPasswordSettings from '../../../common/views/components/password-settings.vue';
import XProfileEditor from '../../../common/views/components/profile-editor.vue';
import XApiSettings from '../../../common/views/components/api-settings.vue';
import XLanguageSettings from '../../../common/views/components/language-settings.vue';
import XNotificationSettings from '../../../common/views/components/notification-settings.vue';

import { url, version } from '../../../config';
import checkForUpdate from '../../../common/scripts/check-for-update';

export default Vue.extend({
	i18n: i18n('desktop/views/components/settings.vue'),
	components: {
		X2fa,
		XApps,
		XSignins,
		XTags,
		XIntegrationSettings,
		XTheme,
		XDriveSettings,
		XMuteAndBlock,
		XPasswordSettings,
		XProfileEditor,
		XApiSettings,
		XLanguageSettings,
		XNotificationSettings,
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
			meta: null,
			version,
			latestVersion: undefined,
			checkingForUpdate: false
		};
	},
	computed: {
		useOsDefaultEmojis: {
			get() { return this.$store.state.device.useOsDefaultEmojis; },
			set(value) { this.$store.commit('device/set', { key: 'useOsDefaultEmojis', value }); }
		},

		reduceMotion: {
			get() { return this.$store.state.device.reduceMotion; },
			set(value) { this.$store.commit('device/set', { key: 'reduceMotion', value }); }
		},

		autoPopout: {
			get() { return this.$store.state.device.autoPopout; },
			set(value) { this.$store.commit('device/set', { key: 'autoPopout', value }); }
		},

		keepCw: {
			get() { return this.$store.state.settings.keepCw; },
			set(value) { this.$store.commit('settings/set', { key: 'keepCw', value }); }
		},

		darkmode: {
			get() { return this.$store.state.device.darkmode; },
			set(value) { this.$store.commit('device/set', { key: 'darkmode', value }); }
		},

		navbar: {
			get() { return this.$store.state.device.navbar; },
			set(value) { this.$store.commit('device/set', { key: 'navbar', value }); }
		},

		deckColumnAlign: {
			get() { return this.$store.state.device.deckColumnAlign; },
			set(value) { this.$store.commit('device/set', { key: 'deckColumnAlign', value }); }
		},

		deckColumnWidth: {
			get() { return this.$store.state.device.deckColumnWidth; },
			set(value) { this.$store.commit('device/set', { key: 'deckColumnWidth', value }); }
		},

		enableSounds: {
			get() { return this.$store.state.device.enableSounds; },
			set(value) { this.$store.commit('device/set', { key: 'enableSounds', value }); }
		},

		soundVolume: {
			get() { return this.$store.state.device.soundVolume; },
			set(value) { this.$store.commit('device/set', { key: 'soundVolume', value }); }
		},

		preventUpdate: {
			get() { return this.$store.state.device.preventUpdate; },
			set(value) { this.$store.commit('device/set', { key: 'preventUpdate', value }); }
		},

		debug: {
			get() { return this.$store.state.device.debug; },
			set(value) { this.$store.commit('device/set', { key: 'debug', value }); }
		},

		enableExperimentalFeatures: {
			get() { return this.$store.state.device.enableExperimentalFeatures; },
			set(value) { this.$store.commit('device/set', { key: 'enableExperimentalFeatures', value }); }
		},

		alwaysShowNsfw: {
			get() { return this.$store.state.device.alwaysShowNsfw; },
			set(value) { this.$store.commit('device/set', { key: 'alwaysShowNsfw', value }); }
		},

		useShadow: {
			get() { return this.$store.state.device.useShadow; },
			set(value) { this.$store.commit('device/set', { key: 'useShadow', value }); }
		},

		roundedCorners: {
			get() { return this.$store.state.device.roundedCorners; },
			set(value) { this.$store.commit('device/set', { key: 'roundedCorners', value }); }
		},

		lineWidth: {
			get() { return this.$store.state.device.lineWidth; },
			set(value) { this.$store.commit('device/set', { key: 'lineWidth', value }); }
		},

		fetchOnScroll: {
			get() { return this.$store.state.settings.fetchOnScroll; },
			set(value) { this.$store.dispatch('settings/set', { key: 'fetchOnScroll', value }); }
		},

		rememberNoteVisibility: {
			get() { return this.$store.state.settings.rememberNoteVisibility; },
			set(value) { this.$store.dispatch('settings/set', { key: 'rememberNoteVisibility', value }); }
		},

		defaultNoteVisibility: {
			get() { return this.$store.state.settings.defaultNoteVisibility; },
			set(value) { this.$store.dispatch('settings/set', { key: 'defaultNoteVisibility', value }); }
		},

		webSearchEngine: {
			get() { return this.$store.state.settings.webSearchEngine; },
			set(value) { this.$store.dispatch('settings/set', { key: 'webSearchEngine', value }); }
		},

		showReplyTarget: {
			get() { return this.$store.state.settings.showReplyTarget; },
			set(value) { this.$store.dispatch('settings/set', { key: 'showReplyTarget', value }); }
		},

		showMyRenotes: {
			get() { return this.$store.state.settings.showMyRenotes; },
			set(value) { this.$store.dispatch('settings/set', { key: 'showMyRenotes', value }); }
		},

		showRenotedMyNotes: {
			get() { return this.$store.state.settings.showRenotedMyNotes; },
			set(value) { this.$store.dispatch('settings/set', { key: 'showRenotedMyNotes', value }); }
		},

		showLocalRenotes: {
			get() { return this.$store.state.settings.showLocalRenotes; },
			set(value) { this.$store.dispatch('settings/set', { key: 'showLocalRenotes', value }); }
		},

		showPostFormOnTopOfTl: {
			get() { return this.$store.state.settings.showPostFormOnTopOfTl; },
			set(value) { this.$store.dispatch('settings/set', { key: 'showPostFormOnTopOfTl', value }); }
		},

		suggestRecentHashtags: {
			get() { return this.$store.state.settings.suggestRecentHashtags; },
			set(value) { this.$store.dispatch('settings/set', { key: 'suggestRecentHashtags', value }); }
		},

		showClockOnHeader: {
			get() { return this.$store.state.settings.showClockOnHeader; },
			set(value) { this.$store.dispatch('settings/set', { key: 'showClockOnHeader', value }); }
		},

		showMaps: {
			get() { return this.$store.state.settings.showMaps; },
			set(value) { this.$store.dispatch('settings/set', { key: 'showMaps', value }); }
		},

		circleIcons: {
			get() { return this.$store.state.settings.circleIcons; },
			set(value) {
				this.$store.dispatch('settings/set', { key: 'circleIcons', value });
				this.reload();
			}
		},

		contrastedAcct: {
			get() { return this.$store.state.settings.contrastedAcct; },
			set(value) {
				this.$store.dispatch('settings/set', { key: 'contrastedAcct', value });
				this.reload();
			}
		},

		showFullAcct: {
			get() { return this.$store.state.settings.showFullAcct; },
			set(value) {
				this.$store.dispatch('settings/set', { key: 'showFullAcct', value });
				this.reload();
			}
		},

		showVia: {
			get() { return this.$store.state.settings.showVia; },
			set(value) { this.$store.dispatch('settings/set', { key: 'showVia', value }); }
		},

		iLikeSushi: {
			get() { return this.$store.state.settings.iLikeSushi; },
			set(value) { this.$store.dispatch('settings/set', { key: 'iLikeSushi', value }); }
		},

		games_reversi_showBoardLabels: {
			get() { return this.$store.state.settings.games.reversi.showBoardLabels; },
			set(value) { this.$store.dispatch('settings/set', { key: 'games.reversi.showBoardLabels', value }); }
		},

		games_reversi_useAvatarStones: {
			get() { return this.$store.state.settings.games.reversi.useAvatarStones; },
			set(value) { this.$store.dispatch('settings/set', { key: 'games.reversi.useAvatarStones', value }); }
		},

		disableAnimatedMfm: {
			get() { return this.$store.state.settings.disableAnimatedMfm; },
			set(value) { this.$store.dispatch('settings/set', { key: 'disableAnimatedMfm', value }); }
		},

		disableShowingAnimatedImages: {
			get() { return this.$store.state.device.disableShowingAnimatedImages; },
			set(value) { this.$store.commit('device/set', { key: 'disableShowingAnimatedImages', value }); }
		},

		remainDeletedNote: {
			get() { return this.$store.state.settings.remainDeletedNote; },
			set(value) { this.$store.dispatch('settings/set', { key: 'remainDeletedNote', value }); }
		}
	},
	created() {
		this.$root.getMeta().then(meta => {
			this.meta = meta;
		});
	},
	methods: {
		reload() {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('@.reload-to-apply-the-setting'),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (!canceled) {
					location.reload();
				}
			});
		},
		customizeHome() {
			location.href = '/?customize';
		},
		updateWallpaper() {
			this.$chooseDriveFile({
				multiple: false
			}).then(file => {
				this.$root.api('i/update', {
					wallpaperId: file.id
				});
			});
		},
		deleteWallpaper() {
			this.$root.api('i/update', {
				wallpaperId: null
			});
		},
		checkForUpdate() {
			this.checkingForUpdate = true;
			checkForUpdate(this.$root, true, true).then(newer => {
				this.checkingForUpdate = false;
				this.latestVersion = newer;
				if (newer == null) {
					this.$root.dialog({
						title: this.$t('no-updates'),
						text: this.$t('no-updates-desc')
					});
				} else {
					this.$root.dialog({
						title: this.$t('update-available'),
						text: this.$t('update-available-desc')
					});
				}
			});
		},
		clean() {
			localStorage.clear();
			this.$root.dialog({
				title: this.$t('cache-cleared'),
				text: this.$t('cache-cleared-desc')
			});
		},
		soundTest() {
			const sound = new Audio(`${url}/assets/message.mp3`);
			sound.volume = this.$store.state.device.soundVolume;
			sound.play();
		}
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

		> section
			margin 32px
			color var(--text)

</style>
