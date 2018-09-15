<template>
<div class="mk-settings">
	<div class="nav">
		<p :class="{ active: page == 'profile' }" @mousedown="page = 'profile'">%fa:user .fw%%i18n:@profile%</p>
		<p :class="{ active: page == 'web' }" @mousedown="page = 'web'">%fa:desktop .fw%Web</p>
		<p :class="{ active: page == 'notification' }" @mousedown="page = 'notification'">%fa:R bell .fw%%i18n:@notification%</p>
		<p :class="{ active: page == 'drive' }" @mousedown="page = 'drive'">%fa:cloud .fw%%i18n:@drive%</p>
		<p :class="{ active: page == 'mute' }" @mousedown="page = 'mute'">%fa:ban .fw%%i18n:@mute%</p>
		<p :class="{ active: page == 'apps' }" @mousedown="page = 'apps'">%fa:puzzle-piece .fw%%i18n:@apps%</p>
		<p :class="{ active: page == 'twitter' }" @mousedown="page = 'twitter'">%fa:B twitter .fw%Twitter</p>
		<p :class="{ active: page == 'security' }" @mousedown="page = 'security'">%fa:unlock-alt .fw%%i18n:@security%</p>
		<p :class="{ active: page == 'api' }" @mousedown="page = 'api'">%fa:key .fw%API</p>
		<p :class="{ active: page == 'other' }" @mousedown="page = 'other'">%fa:cogs .fw%%i18n:@other%</p>
	</div>
	<div class="pages">
		<section class="profile" v-show="page == 'profile'">
			<h1>%i18n:@profile%</h1>
			<x-profile/>
		</section>

		<section class="web" v-show="page == 'web'">
			<h1>%i18n:@behaviour%</h1>
			<mk-switch v-model="fetchOnScroll" text="%i18n:@fetch-on-scroll%">
				<span>%i18n:@fetch-on-scroll-desc%</span>
			</mk-switch>
			<mk-switch v-model="autoPopout" text="%i18n:@auto-popout%">
				<span>%i18n:@auto-popout-desc%</span>
			</mk-switch>

			<section>
				<header>%i18n:@note-visibility%</header>
				<mk-switch v-model="rememberNoteVisibility" text="%i18n:@remember-note-visibility%"/>
				<section>
					<header>%i18n:@default-note-visibility%</header>
					<ui-select v-model="defaultNoteVisibility">
						<option value="public">%i18n:common.note-visibility.public%</option>
						<option value="home">%i18n:common.note-visibility.home%</option>
						<option value="followers">%i18n:common.note-visibility.followers%</option>
						<option value="specified">%i18n:common.note-visibility.specified%</option>
						<option value="private">%i18n:common.note-visibility.private%</option>
					</ui-select>
				</section>
			</section>

			<details>
				<summary>%i18n:@advanced%</summary>
				<mk-switch v-model="apiViaStream" text="%i18n:@api-via-stream%">
					<span>%i18n:@api-via-stream-desc%</span>
				</mk-switch>
			</details>
		</section>

		<section class="web" v-show="page == 'web'">
			<h1>%i18n:@display%</h1>
			<div class="div">
				<button class="ui button" @click="customizeHome" style="margin-bottom: 16px">%i18n:@customize%</button>
			</div>
			<div class="div">
				<button class="ui" @click="updateWallpaper">%i18n:@choose-wallpaper%</button>
				<button class="ui" @click="deleteWallpaper">%i18n:@delete-wallpaper%</button>
				<mk-switch v-model="darkmode" text="%i18n:@dark-mode%"/>
				<mk-switch v-model="circleIcons" text="%i18n:@circle-icons%"/>
				<mk-switch v-model="animations" text="%i18n:common.enable-animations%"/>
				<mk-switch v-model="contrastedAcct" text="%i18n:@contrasted-acct%"/>
				<mk-switch v-model="showFullAcct" text="%i18n:common.show-full-acct%"/>
				<mk-switch v-model="gradientWindowHeader" text="%i18n:@gradient-window-header%"/>
				<mk-switch v-model="iLikeSushi" text="%i18n:common.i-like-sushi%"/>
			</div>
			<mk-switch v-model="showPostFormOnTopOfTl" text="%i18n:@post-form-on-timeline%"/>
			<mk-switch v-model="suggestRecentHashtags" text="%i18n:@suggest-recent-hashtags%"/>
			<mk-switch v-model="showClockOnHeader" text="%i18n:@show-clock-on-header%"/>
			<mk-switch v-model="alwaysShowNsfw" text="%i18n:common.always-show-nsfw%"/>
			<mk-switch v-model="showReplyTarget" text="%i18n:@show-reply-target%"/>
			<mk-switch v-model="showMyRenotes" text="%i18n:@show-my-renotes%"/>
			<mk-switch v-model="showRenotedMyNotes" text="%i18n:@show-renoted-my-notes%"/>
			<mk-switch v-model="showLocalRenotes" text="%i18n:@show-local-renotes%"/>
			<mk-switch v-model="showMaps" text="%i18n:@show-maps%">
				<span>%i18n:@show-maps-desc%</span>
			</mk-switch>
			<mk-switch v-model="disableAnimatedMfm" text="%i18n:common.disable-animated-mfm%"/>
			<mk-switch v-model="games_reversi_showBoardLabels" text="%i18n:common.show-reversi-board-labels%"/>
			<mk-switch v-model="games_reversi_useContrastStones" text="%i18n:common.use-contrast-reversi-stones%"/>
		</section>

		<section class="web" v-show="page == 'web'">
			<h1>%i18n:@sound%</h1>
			<mk-switch v-model="enableSounds" text="%i18n:@enable-sounds%">
				<span>%i18n:@enable-sounds-desc%</span>
			</mk-switch>
			<label>%i18n:@volume%</label>
			<input type="range"
				v-model="soundVolume"
				:disabled="!enableSounds"
				max="1"
				step="0.1"
			/>
			<button class="ui button" @click="soundTest">%fa:volume-up% %i18n:@test%</button>
		</section>

		<section class="web" v-show="page == 'web'">
			<h1>%i18n:@mobile%</h1>
			<mk-switch v-model="disableViaMobile" text="%i18n:@disable-via-mobile%"/>
		</section>

		<section class="web" v-show="page == 'web'">
			<h1>%i18n:@language%</h1>
			<select v-model="lang" placeholder="%i18n:@pick-language%">
				<optgroup label="%i18n:@recommended%">
					<option value="">%i18n:@auto%</option>
				</optgroup>

				<optgroup label="%i18n:@specify-language%">
					<option v-for="x in langs" :value="x[0]" :key="x[0]">{{ x[1] }}</option>
				</optgroup>
			</select>
			<div class="none ui info">
				<p>%fa:info-circle%%i18n:@language-desc%</p>
			</div>
		</section>

		<section class="web" v-show="page == 'web'">
			<h1>%i18n:@cache%</h1>
			<button class="ui button" @click="clean">%i18n:@clean-cache%</button>
			<div class="none ui info warn">
				<p>%fa:exclamation-triangle%%i18n:@cache-warn%</p>
			</div>
		</section>

		<section class="notification" v-show="page == 'notification'">
			<h1>%i18n:@notification%</h1>
			<mk-switch v-model="$store.state.i.settings.autoWatch" @change="onChangeAutoWatch" text="%i18n:@auto-watch%">
				<span>%i18n:@auto-watch-desc%</span>
			</mk-switch>
		</section>

		<section class="drive" v-show="page == 'drive'">
			<h1>%i18n:@drive%</h1>
			<x-drive/>
		</section>

		<section class="mute" v-show="page == 'mute'">
			<h1>%i18n:@mute%</h1>
			<x-mute/>
		</section>

		<section class="apps" v-show="page == 'apps'">
			<h1>%i18n:@apps%</h1>
			<x-apps/>
		</section>

		<section class="twitter" v-show="page == 'twitter'">
			<h1>Twitter</h1>
			<mk-twitter-setting/>
		</section>

		<section class="password" v-show="page == 'security'">
			<h1>%i18n:@password%</h1>
			<x-password/>
		</section>

		<section class="2fa" v-show="page == 'security'">
			<h1>%i18n:@2fa%</h1>
			<x-2fa/>
		</section>

		<section class="signin" v-show="page == 'security'">
			<h1>%i18n:@signin%</h1>
			<x-signins/>
		</section>

		<section class="api" v-show="page == 'api'">
			<h1>API</h1>
			<x-api/>
		</section>

		<section class="other" v-show="page == 'other'">
			<h1>%i18n:@about%</h1>
			<p v-if="meta">%i18n:@operator%: <i><a :href="meta.maintainer.url" target="_blank">{{ meta.maintainer.name }}</a></i></p>
		</section>

		<section class="other" v-show="page == 'other'">
			<h1>%i18n:@update%</h1>
			<p>
				<span>%i18n:@version% <i>{{ version }}</i></span>
				<template v-if="latestVersion !== undefined">
					<br>
					<span>%i18n:@latest-version% <i>{{ latestVersion ? latestVersion : version }}</i></span>
				</template>
			</p>
			<button class="ui button block" @click="checkForUpdate" :disabled="checkingForUpdate">
				<template v-if="checkingForUpdate">%i18n:@update-checking%<mk-ellipsis/></template>
				<template v-else>%i18n:@do-update%</template>
			</button>
			<details>
				<summary>%i18n:@update-settings%</summary>
				<mk-switch v-model="preventUpdate" text="%i18n:@prevent-update%">
					<span>%i18n:@prevent-update-desc%</span>
				</mk-switch>
			</details>
		</section>

		<section class="other" v-show="page == 'other'">
			<h1>%i18n:@advanced-settings%</h1>
			<mk-switch v-model="debug" text="%i18n:@debug-mode%">
				<span>%i18n:@debug-mode-desc%</span>
			</mk-switch>
			<mk-switch v-model="enableExperimentalFeatures" text="%i18n:@experimental%">
				<span>%i18n:@experimental-desc%</span>
			</mk-switch>
		</section>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XProfile from './settings.profile.vue';
import XMute from './settings.mute.vue';
import XPassword from './settings.password.vue';
import X2fa from './settings.2fa.vue';
import XApi from './settings.api.vue';
import XApps from './settings.apps.vue';
import XSignins from './settings.signins.vue';
import XDrive from './settings.drive.vue';
import { url, langs, version } from '../../../config';
import checkForUpdate from '../../../common/scripts/check-for-update';

export default Vue.extend({
	components: {
		XProfile,
		XMute,
		XPassword,
		X2fa,
		XApi,
		XApps,
		XSignins,
		XDrive
	},
	data() {
		return {
			page: 'profile',
			meta: null,
			version,
			langs,
			latestVersion: undefined,
			checkingForUpdate: false
		};
	},
	computed: {
		animations: {
			get() { return this.$store.state.device.animations; },
			set(value) { this.$store.commit('device/set', { key: 'animations', value }); }
		},

		apiViaStream: {
			get() { return this.$store.state.device.apiViaStream; },
			set(value) { this.$store.commit('device/set', { key: 'apiViaStream', value }); }
		},

		autoPopout: {
			get() { return this.$store.state.device.autoPopout; },
			set(value) { this.$store.commit('device/set', { key: 'autoPopout', value }); }
		},

		darkmode: {
			get() { return this.$store.state.device.darkmode; },
			set(value) { this.$store.commit('device/set', { key: 'darkmode', value }); }
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
		},

		disableViaMobile: {
			get() { return this.$store.state.settings.disableViaMobile; },
			set(value) { this.$store.dispatch('settings/set', { key: 'disableViaMobile', value }); }
		},

		gradientWindowHeader: {
			get() { return this.$store.state.settings.gradientWindowHeader; },
			set(value) { this.$store.dispatch('settings/set', { key: 'gradientWindowHeader', value }); }
		},
	},
	created() {
		(this as any).os.getMeta().then(meta => {
			this.meta = meta;
		});
	},
	methods: {
		customizeHome() {
			this.$router.push('/i/customize-home');
			this.$emit('done');
		},
		updateWallpaper() {
			(this as any).apis.chooseDriveFile({
				multiple: false
			}).then(file => {
				(this as any).api('i/update', {
					wallpaperId: file.id
				});
			});
		},
		deleteWallpaper() {
			(this as any).api('i/update', {
				wallpaperId: null
			});
		},
		onChangeAutoWatch(v) {
			(this as any).api('i/update', {
				autoWatch: v
			});
		},
		checkForUpdate() {
			this.checkingForUpdate = true;
			checkForUpdate((this as any).os, true, true).then(newer => {
				this.checkingForUpdate = false;
				this.latestVersion = newer;
				if (newer == null) {
					(this as any).apis.dialog({
						title: '%i18n:@no-updates%',
						text: '%i18n:@no-updates-desc%'
					});
				} else {
					(this as any).apis.dialog({
						title: '%i18n:@update-available%',
						text: '%i18n:@update-available-desc%'
					});
				}
			});
		},
		clean() {
			localStorage.clear();
			(this as any).apis.dialog({
				title: '%i18n:@cache-cleared%',
				text: '%i18n:@cache-cleared-desc%'
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
@import '~const.styl'

root(isDark)
	display flex
	width 100%
	height 100%

	> .nav
		flex 0 0 200px
		width 100%
		height 100%
		padding 16px 0 0 0
		overflow auto
		border-right solid 1px isDark ? #1c2023 : #ddd

		> p
			display block
			padding 10px 16px
			margin 0
			color isDark ? #9aa2a7 : #666
			cursor pointer
			user-select none
			transition margin-left 0.2s ease

			> [data-fa]
				margin-right 4px

			&:hover
				color isDark ? #fff : #555

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
			color isDark ? #c4ccd2 : #4a535a

			> h1
				margin 0 0 1em 0
				padding 0 0 8px 0
				font-size 1em
				color isDark ? #e3e7ea : #555
				border-bottom solid 1px isDark ? #1c2023 : #eee

			&, >>> *
				.ui.button.block
					margin 16px 0

				> section
					margin 32px 0

					> h2
						margin 0 0 1em 0
						padding 0 0 8px 0
						font-size 1em
						color isDark ? #e3e7ea : #555
						border-bottom solid 1px isDark ? #1c2023 : #eee

		> .web
			> .div
				border-bottom solid 1px isDark ? #1c2023 : #eee
				margin 16px 0

.mk-settings[data-darkmode]
	root(true)

.mk-settings:not([data-darkmode])
	root(false)

</style>
