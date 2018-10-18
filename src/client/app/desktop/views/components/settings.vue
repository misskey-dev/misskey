<template>
<div class="mk-settings">
	<div class="nav">
		<p :class="{ active: page == 'profile' }" @mousedown="page = 'profile'">%fa:user .fw%%i18n:@profile%</p>
		<p :class="{ active: page == 'theme' }" @mousedown="page = 'theme'">%fa:palette .fw%%i18n:@theme%</p>
		<p :class="{ active: page == 'web' }" @mousedown="page = 'web'">%fa:desktop .fw%Web</p>
		<p :class="{ active: page == 'notification' }" @mousedown="page = 'notification'">%fa:R bell .fw%%i18n:@notification%</p>
		<p :class="{ active: page == 'drive' }" @mousedown="page = 'drive'">%fa:cloud .fw%%i18n:@drive%</p>
		<p :class="{ active: page == 'hashtags' }" @mousedown="page = 'hashtags'">%fa:hashtag .fw%%i18n:@tags%</p>
		<p :class="{ active: page == 'mute' }" @mousedown="page = 'mute'">%fa:ban .fw%%i18n:@mute%</p>
		<p :class="{ active: page == 'apps' }" @mousedown="page = 'apps'">%fa:puzzle-piece .fw%%i18n:@apps%</p>
		<p :class="{ active: page == 'security' }" @mousedown="page = 'security'">%fa:unlock-alt .fw%%i18n:@security%</p>
		<p :class="{ active: page == 'api' }" @mousedown="page = 'api'">%fa:key .fw%API</p>
		<p :class="{ active: page == 'other' }" @mousedown="page = 'other'">%fa:cogs .fw%%i18n:@other%</p>
	</div>
	<div class="pages">
		<div class="profile" v-show="page == 'profile'">
			<mk-profile-editor/>

			<ui-card>
				<div slot="title">%fa:B twitter% %i18n:@twitter%</div>
				<section>
					<mk-twitter-setting/>
				</section>
			</ui-card>
		</div>

		<ui-card class="theme" v-show="page == 'theme'">
			<div slot="title">%fa:palette% %i18n:@theme%</div>

			<section>
				<mk-theme/>
			</section>
		</ui-card>

		<ui-card class="web" v-show="page == 'web'">
			<div slot="title">%fa:sliders-h% %i18n:@behaviour%</div>

			<section>
				<ui-switch v-model="fetchOnScroll">
					%i18n:@fetch-on-scroll%
					<span slot="desc">%i18n:@fetch-on-scroll-desc%</span>
				</ui-switch>
				<ui-switch v-model="autoPopout">
					%i18n:@auto-popout%
					<span slot="desc">%i18n:@auto-popout-desc%</span>
				</ui-switch>
				<ui-switch v-model="deckNav">%i18n:@deck-nav%<span slot="desc">%i18n:@deck-nav-desc%</span></ui-switch>

				<details>
					<summary>%i18n:@advanced%</summary>
					<ui-switch v-model="apiViaStream">
						%i18n:@api-via-stream%
						<span slot="desc">%i18n:@api-via-stream-desc%</span>
					</ui-switch>
				</details>
			</section>

			<section>
				<header>%i18n:@note-visibility%</header>
				<ui-switch v-model="rememberNoteVisibility">%i18n:@remember-note-visibility%</ui-switch>
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
		</ui-card>

		<ui-card class="web" v-show="page == 'web'">
			<div slot="title">%fa:desktop% %i18n:@display%</div>

			<section>
				<ui-button @click="customizeHome">%i18n:@customize%</ui-button>
			</section>
			<section>
				<header>%i18n:@wallpaper%</header>
				<ui-button @click="updateWallpaper">%i18n:@choose-wallpaper%</ui-button>
				<ui-button @click="deleteWallpaper">%i18n:@delete-wallpaper%</ui-button>
			</section>
			<section>
				<header>%i18n:@navbar-position%</header>
				<ui-radio v-model="navbar" value="top">%i18n:@navbar-position-top%</ui-radio>
				<ui-radio v-model="navbar" value="left">%i18n:@navbar-position-left%</ui-radio>
				<ui-radio v-model="navbar" value="right">%i18n:@navbar-position-right%</ui-radio>
			</section>
			<section>
				<ui-switch v-model="darkmode">%i18n:@dark-mode%</ui-switch>
				<ui-switch v-model="useShadow">%i18n:@use-shadow%</ui-switch>
				<ui-switch v-model="roundedCorners">%i18n:@rounded-corners%</ui-switch>
				<ui-switch v-model="circleIcons">%i18n:@circle-icons%</ui-switch>
				<ui-switch v-model="reduceMotion">%i18n:common.reduce-motion%</ui-switch>
				<ui-switch v-model="contrastedAcct">%i18n:@contrasted-acct%</ui-switch>
				<ui-switch v-model="showFullAcct">%i18n:common.show-full-acct%</ui-switch>
				<ui-switch v-model="iLikeSushi">%i18n:common.i-like-sushi%</ui-switch>
			</section>
			<section>
				<ui-switch v-model="showPostFormOnTopOfTl">%i18n:@post-form-on-timeline%</ui-switch>
				<ui-switch v-model="suggestRecentHashtags">%i18n:@suggest-recent-hashtags%</ui-switch>
				<ui-switch v-model="showClockOnHeader">%i18n:@show-clock-on-header%</ui-switch>
				<ui-switch v-model="alwaysShowNsfw">%i18n:common.always-show-nsfw%</ui-switch>
				<ui-switch v-model="showReplyTarget">%i18n:@show-reply-target%</ui-switch>
				<ui-switch v-model="showMyRenotes">%i18n:@show-my-renotes%</ui-switch>
				<ui-switch v-model="showRenotedMyNotes">%i18n:@show-renoted-my-notes%</ui-switch>
				<ui-switch v-model="showLocalRenotes">%i18n:@show-local-renotes%</ui-switch>
				<ui-switch v-model="showMaps">%i18n:@show-maps%</ui-switch>
				<ui-switch v-model="disableAnimatedMfm">%i18n:common.disable-animated-mfm%</ui-switch>
				<ui-switch v-model="games_reversi_showBoardLabels">%i18n:common.show-reversi-board-labels%</ui-switch>
				<ui-switch v-model="games_reversi_useContrastStones">%i18n:common.use-contrast-reversi-stones%</ui-switch>
			</section>
			<section>
				<header>%i18n:@deck-column-align%</header>
				<ui-radio v-model="deckColumnAlign" value="center">%i18n:@deck-column-align-center%</ui-radio>
				<ui-radio v-model="deckColumnAlign" value="left">%i18n:@deck-column-align-left%</ui-radio>
			</section>
		</ui-card>

		<ui-card class="web" v-show="page == 'web'">
			<div slot="title">%fa:volume-up% %i18n:@sound%</div>

			<section>
				<ui-switch v-model="enableSounds">
					%i18n:@enable-sounds%
					<span slot="desc">%i18n:@enable-sounds-desc%</span>
				</ui-switch>
				<label>%i18n:@volume%</label>
				<input type="range"
					v-model="soundVolume"
					:disabled="!enableSounds"
					max="1"
					step="0.1"
				/>
				<ui-button @click="soundTest">%fa:volume-up% %i18n:@test%</ui-button>
			</section>
		</ui-card>

		<ui-card class="web" v-show="page == 'web'">
			<div slot="title">%fa:language% %i18n:@language%</div>
			<section class="fit-top">
				<ui-select v-model="lang" placeholder="%i18n:@pick-language%">
					<optgroup label="%i18n:@recommended%">
						<option value="">%i18n:@auto%</option>
					</optgroup>

					<optgroup label="%i18n:@specify-language%">
						<option v-for="x in langs" :value="x[0]" :key="x[0]">{{ x[1] }}</option>
					</optgroup>
				</ui-select>
				<div class="none ui info">
					<p>%fa:info-circle%%i18n:@language-desc%</p>
				</div>
			</section>
		</ui-card>

		<ui-card class="web" v-show="page == 'web'">
			<div slot="title">%fa:trash-alt R% %i18n:@cache%</div>
			<section>
				<ui-button @click="clean">%i18n:@clean-cache%</ui-button>
				<div class="none ui info warn">
					<p>%fa:exclamation-triangle%%i18n:@cache-warn%</p>
				</div>
			</section>
		</ui-card>

		<ui-card class="notification" v-show="page == 'notification'">
			<div slot="title">%fa:bell R% %i18n:@notification%</div>
			<section>
				<ui-switch v-model="$store.state.i.settings.autoWatch" @change="onChangeAutoWatch">
					%i18n:@auto-watch%
					<span slot="desc">%i18n:@auto-watch-desc%</span>
				</ui-switch>
				<section>
					<ui-button @click="readAllUnreadNotes">%i18n:@mark-as-read-all-unread-notes%</ui-button>
				</section>
			</section>
		</ui-card>

		<ui-card class="drive" v-show="page == 'drive'">
			<div slot="title">%fa:cloud% %i18n:@drive%</div>
			<section>
				<x-drive/>
			</section>
		</ui-card>

		<ui-card class="hashtags" v-show="page == 'hashtags'">
			<div slot="title">%fa:hashtag% %i18n:@tags%</div>
			<section>
				<x-tags/>
			</section>
		</ui-card>

		<ui-card class="mute" v-show="page == 'mute'">
			<div slot="title">%fa:ban% %i18n:@mute%</div>
			<section>
				<x-mute/>
			</section>
		</ui-card>

		<ui-card class="apps" v-show="page == 'apps'">
			<div slot="title">%fa:puzzle-piece% %i18n:@apps%</div>
			<section>
				<x-apps/>
			</section>
		</ui-card>

		<ui-card class="password" v-show="page == 'security'">
			<div slot="title">%fa:unlock-alt% %i18n:@password%</div>
			<section>
				<x-password/>
			</section>
		</ui-card>

		<ui-card class="2fa" v-show="page == 'security'">
			<div slot="title">%fa:mobile-alt% %i18n:@2fa%</div>
			<section>
				<x-2fa/>
			</section>
		</ui-card>

		<ui-card class="signin" v-show="page == 'security'">
			<div slot="title">%fa:sign-in-alt% %i18n:@signin%</div>
			<section>
				<x-signins/>
			</section>
		</ui-card>

		<ui-card class="api" v-show="page == 'api'">
			<div slot="title">%fa:key% API</div>
			<section class="fit-top">
				<x-api/>
			</section>
		</ui-card>

		<ui-card class="other" v-show="page == 'other'">
			<div slot="title">%fa:info-circle% %i18n:@about%</div>
			<section>
				<p v-if="meta">%i18n:@operator%: <i><a :href="meta.maintainer.url" target="_blank">{{ meta.maintainer.name }}</a></i></p>
			</section>
		</ui-card>

		<ui-card class="other" v-show="page == 'other'">
			<div slot="title">%fa:sync-alt% %i18n:@update%</div>
			<section>
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
					<ui-switch v-model="preventUpdate">
						%i18n:@prevent-update%
						<span slot="desc">%i18n:@prevent-update-desc%</span>
					</ui-switch>
				</details>
			</section>
		</ui-card>

		<ui-card class="other" v-show="page == 'other'">
			<div slot="title">%fa:cogs% %i18n:@advanced-settings%</div>
			<section>
				<ui-switch v-model="debug">
					%i18n:@debug-mode%
					<span slot="desc">%i18n:@debug-mode-desc%</span>
				</ui-switch>
				<ui-switch v-model="enableExperimentalFeatures">
					%i18n:@experimental%
					<span slot="desc">%i18n:@experimental-desc%</span>
				</ui-switch>
			</section>
		</ui-card>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XMute from './settings.mute.vue';
import XPassword from './settings.password.vue';
import X2fa from './settings.2fa.vue';
import XApi from './settings.api.vue';
import XApps from './settings.apps.vue';
import XSignins from './settings.signins.vue';
import XDrive from './settings.drive.vue';
import XTags from './settings.tags.vue';
import { url, langs, version } from '../../../config';
import checkForUpdate from '../../../common/scripts/check-for-update';

export default Vue.extend({
	components: {
		XMute,
		XPassword,
		X2fa,
		XApi,
		XApps,
		XSignins,
		XDrive,
		XTags
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
		(this as any).os.getMeta().then(meta => {
			this.meta = meta;
		});
	},
	methods: {
		readAllUnreadNotes() {
			(this as any).api('i/read_all_unread_notes');
		},
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
		border-right solid 1px var(--faceDivider)

		> p
			display block
			padding 10px 16px
			margin 0
			color var(--desktopSettingsNavItem)
			cursor pointer
			user-select none
			transition margin-left 0.2s ease

			> [data-fa]
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
