<template>
<div class="mk-settings">
	<div class="nav">
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

			<ui-card>
				<div slot="title"><fa :icon="['fab', 'twitter']"/> {{ $t('twitter') }}</div>
				<section>
					<mk-twitter-setting/>
				</section>
			</ui-card>

			<ui-card>
				<div slot="title"><fa :icon="['fab', 'github']"/> {{ $t('github') }}</div>
				<section>
					<mk-github-setting/>
				</section>
			</ui-card>

			<ui-card>
				<div slot="title"><fa :icon="['fab', 'discord']"/> {{ $t('discord') }}</div>
				<section>
					<mk-discord-setting/>
				</section>
			</ui-card>
		</div>

		<ui-card class="theme" v-show="page == 'theme'">
			<div slot="title"><fa icon="palette"/> {{ $t('theme') }}</div>

			<section>
				<x-theme/>
			</section>
		</ui-card>

		<ui-card class="web" v-show="page == 'web'">
			<div slot="title"><fa icon="sliders-h"/> {{ $t('behaviour') }}</div>

			<section>
				<ui-switch v-model="fetchOnScroll">{{ $t('fetch-on-scroll') }}
					<span slot="desc">{{ $t('fetch-on-scroll-desc') }}</span>
				</ui-switch>
				<ui-switch v-model="autoPopout">{{ $t('auto-popout') }}
					<span slot="desc">{{ $t('auto-popout-desc') }}</span>
				</ui-switch>
				<ui-switch v-model="deckNav">{{ $t('deck-nav') }}<span slot="desc">{{ $t('deck-nav-desc') }}</span></ui-switch>

				<details>
					<summary>{{ $t('advanced') }}</summary>
					<ui-switch v-model="apiViaStream">{{ $t('api-via-stream') }}
						<span slot="desc">{{ $t('api-via-stream-desc') }}</span>
					</ui-switch>
				</details>
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
						<option value="private">{{ $t('@.note-visibility.private') }}</option>
					</ui-select>
				</section>
			</section>
		</ui-card>

		<ui-card class="web" v-show="page == 'web'">
			<div slot="title"><fa icon="desktop"/> {{ $t('display') }}</div>

			<section>
				<ui-switch v-model="showPostFormOnTopOfTl">{{ $t('post-form-on-timeline') }}</ui-switch>
				<ui-button @click="customizeHome">{{ $t('customize') }}</ui-button>
			</section>
			<section>
				<header>{{ $t('wallpaper') }}</header>
				<ui-button @click="updateWallpaper">{{ $t('choose-wallpaper') }}</ui-button>
				<ui-button @click="deleteWallpaper">{{ $t('delete-wallpaper') }}</ui-button>
			</section>
			<section>
				<header>{{ $t('navbar-position') }}</header>
				<ui-radio v-model="navbar" value="top">{{ $t('navbar-position-top') }}</ui-radio>
				<ui-radio v-model="navbar" value="left">{{ $t('navbar-position-left') }}</ui-radio>
				<ui-radio v-model="navbar" value="right">{{ $t('navbar-position-right') }}</ui-radio>
			</section>
			<section>
				<ui-switch v-model="deckDefault">{{ $t('deck-default') }}</ui-switch>
			</section>
			<section>
				<ui-switch v-model="darkmode">{{ $t('dark-mode') }}</ui-switch>
				<ui-switch v-model="useShadow">{{ $t('use-shadow') }}</ui-switch>
				<ui-switch v-model="roundedCorners">{{ $t('rounded-corners') }}</ui-switch>
				<ui-switch v-model="circleIcons">{{ $t('circle-icons') }}</ui-switch>
				<ui-switch v-model="reduceMotion">{{ $t('@.reduce-motion') }}</ui-switch>
				<ui-switch v-model="contrastedAcct">{{ $t('contrasted-acct') }}</ui-switch>
				<ui-switch v-model="showFullAcct">{{ $t('@.show-full-acct') }}</ui-switch>
				<ui-switch v-model="showVia">{{ $t('@.show-via') }}</ui-switch>
				<ui-switch v-model="useOsDefaultEmojis">{{ $t('@.use-os-default-emojis') }}</ui-switch>
				<ui-switch v-model="iLikeSushi">{{ $t('@.i-like-sushi') }}</ui-switch>
			</section>
			<section>
				<ui-switch v-model="suggestRecentHashtags">{{ $t('suggest-recent-hashtags') }}</ui-switch>
				<ui-switch v-model="showClockOnHeader">{{ $t('show-clock-on-header') }}</ui-switch>
				<ui-switch v-model="alwaysShowNsfw">{{ $t('@.always-show-nsfw') }}</ui-switch>
				<ui-switch v-model="showReplyTarget">{{ $t('show-reply-target') }}</ui-switch>
				<ui-switch v-model="showMaps">{{ $t('show-maps') }}</ui-switch>
				<ui-switch v-model="disableAnimatedMfm">{{ $t('@.disable-animated-mfm') }}</ui-switch>
			</section>
			<section>
				<header>{{ $t('deck-column-align') }}</header>
				<ui-radio v-model="deckColumnAlign" value="center">{{ $t('deck-column-align-center') }}</ui-radio>
				<ui-radio v-model="deckColumnAlign" value="left">{{ $t('deck-column-align-left') }}</ui-radio>
			</section>
			<section>
				<ui-switch v-model="games_reversi_showBoardLabels">{{ $t('@.show-reversi-board-labels') }}</ui-switch>
				<ui-switch v-model="games_reversi_useContrastStones">{{ $t('@.use-contrast-reversi-stones') }}</ui-switch>
			</section>
		</ui-card>

		<ui-card class="web" v-show="page == 'web'">
			<div slot="title"><fa icon="volume-up"/> {{ $t('sound') }}</div>

			<section>
				<ui-switch v-model="enableSounds">{{ $t('enable-sounds') }}
					<span slot="desc">{{ $t('enable-sounds-desc') }}</span>
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

		<ui-card class="web" v-show="page == 'web'">
			<div slot="title"><fa icon="language"/> {{ $t('language') }}</div>
			<section class="fit-top">
				<ui-select v-model="lang" :placeholder="$t('pick-language')">
					<optgroup :label="$t('recommended')">
						<option value="">{{ $t('auto') }}</option>
					</optgroup>

					<optgroup :label="$t('specify-language')">
						<option v-for="x in langs" :value="x[0]" :key="x[0]">{{ x[1] }}</option>
					</optgroup>
				</ui-select>
				<div class="none ui info">
					<p><fa icon="info-circle"/>{{ $t('language-desc') }}</p>
				</div>
			</section>
		</ui-card>

		<ui-card class="web" v-show="page == 'web'">
			<div slot="title"><fa :icon="['far', 'trash-alt']"/> {{ $t('cache') }}</div>
			<section>
				<ui-button @click="clean">{{ $t('clean-cache') }}</ui-button>
				<div class="none ui info warn">
					<p><fa icon="exclamation-triangle"/>{{ $t('cache-warn') }}</p>
				</div>
			</section>
		</ui-card>

		<ui-card class="notification" v-show="page == 'notification'">
			<div slot="title"><fa :icon="['far', 'bell']"/> {{ $t('notification') }}</div>
			<section>
				<ui-switch v-model="$store.state.i.settings.autoWatch" @change="onChangeAutoWatch">
					{{ $t('auto-watch') }}<span slot="desc">{{ $t('auto-watch-desc') }}</span>
				</ui-switch>
				<section>
					<ui-button @click="readAllUnreadNotes">{{ $t('mark-as-read-all-unread-notes') }}</ui-button>
				</section>
			</section>
		</ui-card>

		<div class="drive" v-if="page == 'drive'">
			<x-drive-settings/>
		</div>

		<ui-card class="hashtags" v-show="page == 'hashtags'">
			<div slot="title"><fa icon="hashtag"/> {{ $t('tags') }}</div>
			<section>
				<x-tags/>
			</section>
		</ui-card>

		<div class="muteAndBlock" v-show="page == 'muteAndBlock'">
			<x-mute-and-block/>
		</div>

		<ui-card class="apps" v-show="page == 'apps'">
			<div slot="title"><fa icon="puzzle-piece"/> {{ $t('apps') }}</div>
			<section>
				<x-apps/>
			</section>
		</ui-card>

		<ui-card class="password" v-show="page == 'security'">
			<div slot="title"><fa icon="unlock-alt"/> {{ $t('password') }}</div>
			<section>
				<x-password-settings/>
			</section>
		</ui-card>

		<ui-card class="2fa" v-show="page == 'security'">
			<div slot="title"><fa icon="mobile-alt"/> {{ $t('2fa') }}</div>
			<section>
				<x-2fa/>
			</section>
		</ui-card>

		<ui-card class="signin" v-show="page == 'security'">
			<div slot="title"><fa icon="sign-in-alt"/> {{ $t('signin') }}</div>
			<section>
				<x-signins/>
			</section>
		</ui-card>

		<div class="api" v-show="page == 'api'">
			<x-api-settings/>
		</div>

		<ui-card class="other" v-show="page == 'other'">
			<div slot="title"><fa icon="info-circle"/> {{ $t('about') }}</div>
			<section>
				<p v-if="meta">{{ $t('operator') }}: <i><a :href="'mailto:' + meta.maintainer.email" target="_blank">{{ meta.maintainer.name }}</a></i></p>
			</section>
		</ui-card>

		<ui-card class="other" v-show="page == 'other'">
			<div slot="title"><fa icon="sync-alt"/> {{ $t('update') }}</div>
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
						{{ $t('prevent-update') }}<span slot="desc">{{ $t('prevent-update-desc') }}</span>
					</ui-switch>
				</details>
			</section>
		</ui-card>

		<ui-card class="other" v-show="page == 'other'">
			<div slot="title"><fa icon="cogs"/> {{ $t('advanced-settings') }}</div>
			<section>
				<ui-switch v-model="debug">
					{{ $t('debug-mode') }}<span slot="desc">{{ $t('debug-mode-desc') }}</span>
				</ui-switch>
				<ui-switch v-model="enableExperimentalFeatures">
					{{ $t('experimental') }}<span slot="desc">{{ $t('experimental-desc') }}</span>
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
import { url, langs, clientVersion as version } from '../../../config';
import checkForUpdate from '../../../common/scripts/check-for-update';

export default Vue.extend({
	i18n: i18n('desktop/views/components/settings.vue'),
	components: {
		X2fa,
		XApps,
		XSignins,
		XTags,
		XTheme: () => import('../../../common/views/components/theme.vue').then(m => m.default),
		XDriveSettings: () => import('../../../common/views/components/drive-settings.vue').then(m => m.default),
		XMuteAndBlock: () => import('../../../common/views/components/mute-and-block.vue').then(m => m.default),
		XPasswordSettings: () => import('../../../common/views/components/password-settings.vue').then(m => m.default),
		XProfileEditor: () => import('../../../common/views/components/profile-editor.vue').then(m => m.default),
		XApiSettings: () => import('../../../common/views/components/api-settings.vue').then(m => m.default),
	},
	props: {
		initialPage: {
			type: String,
			required: false
		}
	},
	data() {
		return {
			page: this.initialPage || 'profile',
			meta: null,
			version,
			langs,
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

		apiViaStream: {
			get() { return this.$store.state.device.apiViaStream; },
			set(value) { this.$store.commit('device/set', { key: 'apiViaStream', value }); }
		},

		autoPopout: {
			get() { return this.$store.state.device.autoPopout; },
			set(value) { this.$store.commit('device/set', { key: 'autoPopout', value }); }
		},

		deckNav: {
			get() { return this.$store.state.settings.deckNav; },
			set(value) { this.$store.commit('settings/set', { key: 'deckNav', value }); }
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

		deckDefault: {
			get() { return this.$store.state.device.deckDefault; },
			set(value) { this.$store.commit('device/set', { key: 'deckDefault', value }); }
		},

		enableSounds: {
			get() { return this.$store.state.device.enableSounds; },
			set(value) { this.$store.commit('device/set', { key: 'enableSounds', value }); }
		},

		soundVolume: {
			get() { return this.$store.state.device.soundVolume; },
			set(value) { this.$store.commit('device/set', { key: 'soundVolume', value }); }
		},

		lang: {
			get() { return this.$store.state.device.lang; },
			set(value) { this.$store.commit('device/set', { key: 'lang', value }); }
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
			get() { return this.$store.state.settings.useShadow; },
			set(value) { this.$store.dispatch('settings/set', { key: 'useShadow', value }); }
		},

		roundedCorners: {
			get() { return this.$store.state.settings.roundedCorners; },
			set(value) { this.$store.dispatch('settings/set', { key: 'roundedCorners', value }); }
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
			set(value) { this.$store.dispatch('settings/set', { key: 'circleIcons', value }); }
		},

		contrastedAcct: {
			get() { return this.$store.state.settings.contrastedAcct; },
			set(value) { this.$store.dispatch('settings/set', { key: 'contrastedAcct', value }); }
		},

		showFullAcct: {
			get() { return this.$store.state.settings.showFullAcct; },
			set(value) { this.$store.dispatch('settings/set', { key: 'showFullAcct', value }); }
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

		games_reversi_useContrastStones: {
			get() { return this.$store.state.settings.games.reversi.useContrastStones; },
			set(value) { this.$store.dispatch('settings/set', { key: 'games.reversi.useContrastStones', value }); }
		},

		disableAnimatedMfm: {
			get() { return this.$store.state.settings.disableAnimatedMfm; },
			set(value) { this.$store.dispatch('settings/set', { key: 'disableAnimatedMfm', value }); }
		}
	},
	created() {
		this.$root.getMeta().then(meta => {
			this.meta = meta;
		});
	},
	methods: {
		readAllUnreadNotes() {
			this.$root.api('i/read_all_unread_notes');
		},
		customizeHome() {
			this.$router.push('/i/customize-home');
			this.$emit('done');
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
		onChangeAutoWatch(v) {
			this.$root.api('i/update', {
				autoWatch: v
			});
		},
		checkForUpdate() {
			this.checkingForUpdate = true;
			checkForUpdate(this.$root, true, true).then(newer => {
				this.checkingForUpdate = false;
				this.latestVersion = newer;
				if (newer == null) {
					this.$root.alert({
						title: this.$t('no-updates'),
						text: this.$t('no-updates-desc')
					});
				} else {
					this.$root.alert({
						title: this.$t('update-available'),
						text: this.$t('update-available-desc')
					});
				}
			});
		},
		clean() {
			localStorage.clear();
			this.$root.alert({
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
		box-shadow var(--shadowRight)
		z-index 1

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
