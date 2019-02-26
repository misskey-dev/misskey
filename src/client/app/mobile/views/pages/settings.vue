<template>
<mk-ui>
	<template #header><span style="margin-right:4px;"><fa icon="cog"/></span>{{ $t('settings') }}</template>
	<main>
		<div class="signed-in-as">
			<mfm :text="$t('signed-in-as').replace('{}', name)" :should-break="false" :plain-text="true" :custom-emojis="$store.state.i.emojis"/>
		</div>
		<div>
			<x-profile-editor/>

			<x-theme/>

			<ui-card>
				<template #title><fa icon="poll-h"/> {{ $t('design') }}</template>

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
					<ui-switch v-model="disableAnimatedMfm">{{ $t('@.disable-animated-mfm') }}</ui-switch>
					<ui-switch v-model="disableShowingAnimatedImages">{{ $t('@.disable-showing-animated-images') }}</ui-switch>
					<ui-switch v-model="suggestRecentHashtags">{{ $t('@.suggest-recent-hashtags') }}</ui-switch>
					<ui-switch v-model="alwaysShowNsfw">{{ $t('@.always-show-nsfw') }} ({{ $t('@.this-setting-is-this-device-only') }})</ui-switch>
				</section>

				<section>
					<ui-switch v-model="games_reversi_showBoardLabels">{{ $t('@.show-reversi-board-labels') }}</ui-switch>
					<ui-switch v-model="games_reversi_useAvatarStones">{{ $t('@.use-avatar-reversi-stones') }}</ui-switch>
				</section>

				<section>
					<header>{{ $t('timeline') }}</header>
					<div>
						<ui-switch v-model="showReplyTarget">{{ $t('show-reply-target') }}</ui-switch>
						<ui-switch v-model="showMyRenotes">{{ $t('show-my-renotes') }}</ui-switch>
						<ui-switch v-model="showRenotedMyNotes">{{ $t('show-renoted-my-notes') }}</ui-switch>
						<ui-switch v-model="showLocalRenotes">{{ $t('show-local-renotes') }}</ui-switch>
					</div>
				</section>

				<section>
					<header>{{ $t('post-style') }}</header>
					<ui-radio v-model="postStyle" value="standard">{{ $t('post-style-standard') }}</ui-radio>
					<ui-radio v-model="postStyle" value="smart">{{ $t('post-style-smart') }}</ui-radio>
				</section>

				<section>
					<header>{{ $t('notification-position') }}</header>
					<ui-radio v-model="mobileNotificationPosition" value="bottom">{{ $t('notification-position-bottom') }}</ui-radio>
					<ui-radio v-model="mobileNotificationPosition" value="top">{{ $t('notification-position-top') }}</ui-radio>
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
			</ui-card>

			<ui-card>
				<template #title><fa icon="sliders-h"/> {{ $t('behavior') }}</template>

				<section>
					<ui-switch v-model="fetchOnScroll">{{ $t('fetch-on-scroll') }}</ui-switch>
					<ui-switch v-model="keepCw">{{ $t('keep-cw') }}</ui-switch>
					<ui-switch v-model="disableViaMobile">{{ $t('disable-via-mobile') }}</ui-switch>
					<ui-switch v-model="loadRawImages">{{ $t('load-raw-images') }}</ui-switch>
					<ui-switch v-model="loadRemoteMedia">{{ $t('load-remote-media') }}</ui-switch>
					<ui-switch v-model="lightmode">{{ $t('i-am-under-limited-internet') }}</ui-switch>
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

			<x-notification-settings/>

			<x-drive-settings/>

			<x-mute-and-block/>

			<ui-card>
				<template #title><fa icon="volume-up"/> {{ $t('sound') }}</template>

				<section>
					<ui-switch v-model="enableSounds">{{ $t('enable-sounds') }}</ui-switch>
				</section>
			</ui-card>

			<x-language-settings/>

			<x-integration-settings/>

			<x-api-settings />

			<ui-card>
				<template #title><fa icon="unlock-alt"/> {{ $t('password') }}</template>
				<section>
					<x-password-settings/>
				</section>
			</ui-card>

			<ui-card>
				<template #title><fa icon="sync-alt"/> {{ $t('update') }}</template>

				<section>
					<div>{{ $t('version') }} <i>{{ version }}</i></div>
					<template v-if="latestVersion !== undefined">
						<div>{{ $t('latest-version') }} <i>{{ latestVersion ? latestVersion : version }}</i></div>
					</template>
					<ui-button @click="checkForUpdate" :disabled="checkingForUpdate">
						<template v-if="checkingForUpdate">{{ $t('update-checking') }}<mk-ellipsis/></template>
						<template v-else>{{ $t('check-for-updates') }}</template>
					</ui-button>
				</section>
			</ui-card>
		</div>

		<div class="signout" @click="signout">{{ $t('@.signout') }}</div>

		<footer>
			<small>ver {{ version }} ({{ codename }})</small>
		</footer>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { apiUrl, version, codename } from '../../../config';
import checkForUpdate from '../../../common/scripts/check-for-update';
import XTheme from '../../../common/views/components/theme.vue';
import XDriveSettings from '../../../common/views/components/drive-settings.vue';
import XMuteAndBlock from '../../../common/views/components/mute-and-block.vue';
import XPasswordSettings from '../../../common/views/components/password-settings.vue';
import XProfileEditor from '../../../common/views/components/profile-editor.vue';
import XApiSettings from '../../../common/views/components/api-settings.vue';
import XLanguageSettings from '../../../common/views/components/language-settings.vue';
import XIntegrationSettings from '../../../common/views/components/integration-settings.vue';
import XNotificationSettings from '../../../common/views/components/notification-settings.vue';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/settings.vue'),

	components: {
		XTheme,
		XDriveSettings,
		XMuteAndBlock,
		XPasswordSettings,
		XProfileEditor,
		XApiSettings,
		XLanguageSettings,
		XIntegrationSettings,
		XNotificationSettings,
	},

	data() {
		return {
			apiUrl,
			version,
			codename,
			latestVersion: undefined,
			checkingForUpdate: false
		};
	},

	computed: {
		name(): string {
			return Vue.filter('userName')(this.$store.state.i);
		},

		darkmode: {
			get() { return this.$store.state.device.darkmode; },
			set(value) { this.$store.commit('device/set', { key: 'darkmode', value }); }
		},

		useShadow: {
			get() { return this.$store.state.device.useShadow; },
			set(value) { this.$store.commit('device/set', { key: 'useShadow', value }); }
		},

		roundedCorners: {
			get() { return this.$store.state.device.roundedCorners; },
			set(value) { this.$store.commit('device/set', { key: 'roundedCorners', value }); }
		},

		useOsDefaultEmojis: {
			get() { return this.$store.state.device.useOsDefaultEmojis; },
			set(value) { this.$store.commit('device/set', { key: 'useOsDefaultEmojis', value }); }
		},

		reduceMotion: {
			get() { return this.$store.state.device.reduceMotion; },
			set(value) { this.$store.commit('device/set', { key: 'reduceMotion', value }); }
		},

		suggestRecentHashtags: {
			get() { return this.$store.state.settings.suggestRecentHashtags; },
			set(value) { this.$store.commit('device/set', { key: 'suggestRecentHashtags', value }); }
		},

		alwaysShowNsfw: {
			get() { return this.$store.state.device.alwaysShowNsfw; },
			set(value) { this.$store.commit('device/set', { key: 'alwaysShowNsfw', value }); }
		},

		postStyle: {
			get() { return this.$store.state.device.postStyle; },
			set(value) { this.$store.commit('device/set', { key: 'postStyle', value }); }
		},

		mobileNotificationPosition: {
			get() { return this.$store.state.device.mobileNotificationPosition; },
			set(value) { this.$store.commit('device/set', { key: 'mobileNotificationPosition', value }); }
		},

		lightmode: {
			get() { return this.$store.state.device.lightmode; },
			set(value) { this.$store.commit('device/set', { key: 'lightmode', value }); }
		},

		loadRawImages: {
			get() { return this.$store.state.device.loadRawImages; },
			set(value) { this.$store.commit('device/set', { key: 'loadRawImages', value }); }
		},

		enableSounds: {
			get() { return this.$store.state.device.enableSounds; },
			set(value) { this.$store.commit('device/set', { key: 'enableSounds', value }); }
		},

		deckColumnAlign: {
			get() { return this.$store.state.device.deckColumnAlign; },
			set(value) { this.$store.commit('device/set', { key: 'deckColumnAlign', value }); }
		},

		deckColumnWidth: {
			get() { return this.$store.state.device.deckColumnWidth; },
			set(value) { this.$store.commit('device/set', { key: 'deckColumnWidth', value }); }
		},

		fetchOnScroll: {
			get() { return this.$store.state.settings.fetchOnScroll; },
			set(value) { this.$store.dispatch('settings/set', { key: 'fetchOnScroll', value }); }
		},

		keepCw: {
			get() { return this.$store.state.settings.keepCw; },
			set(value) { this.$store.dispatch('settings/set', { key: 'keepCw', value }); }
		},

		rememberNoteVisibility: {
			get() { return this.$store.state.settings.rememberNoteVisibility; },
			set(value) { this.$store.dispatch('settings/set', { key: 'rememberNoteVisibility', value }); }
		},

		disableViaMobile: {
			get() { return this.$store.state.settings.disableViaMobile; },
			set(value) { this.$store.dispatch('settings/set', { key: 'disableViaMobile', value }); }
		},

		loadRemoteMedia: {
			get() { return this.$store.state.settings.loadRemoteMedia; },
			set(value) { this.$store.dispatch('settings/set', { key: 'loadRemoteMedia', value }); }
		},

		circleIcons: {
			get() { return this.$store.state.settings.circleIcons; },
			set(value) { this.$store.dispatch('settings/set', { key: 'circleIcons', value }); }
		},

		lineWidth: {
			get() { return this.$store.state.device.lineWidth; },
			set(value) { this.$store.commit('device/set', { key: 'lineWidth', value }); }
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

		defaultNoteVisibility: {
			get() { return this.$store.state.settings.defaultNoteVisibility; },
			set(value) { this.$store.dispatch('settings/set', { key: 'defaultNoteVisibility', value }); }
		},

		webSearchEngine: {
			get() { return this.$store.state.settings.webSearchEngine; },
			set(value) { this.$store.dispatch('settings/set', { key: 'webSearchEngine', value }); }
		},
	},

	mounted() {
		document.title = this.$t('settings');
	},

	methods: {
		signout() {
			this.$root.signout();
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
		}
	}
});
</script>

<style lang="stylus" scoped>
main

	> .signed-in-as
		margin 16px
		padding 16px
		text-align center
		color var(--mobileSignedInAsFg)
		background var(--mobileSignedInAsBg)
		box-shadow 0 3px 1px -2px rgba(#000, 0.2), 0 2px 2px 0 rgba(#000, 0.14), 0 1px 5px 0 rgba(#000, 0.12)
		font-weight bold

	> .signout
		margin 16px
		padding 16px
		text-align center
		color var(--mobileSignedInAsFg)
		background var(--mobileSignedInAsBg)
		box-shadow 0 3px 1px -2px rgba(#000, 0.2), 0 2px 2px 0 rgba(#000, 0.14), 0 1px 5px 0 rgba(#000, 0.12)

	> footer
		margin 16px
		text-align center
		color var(--text)
		opacity 0.7

</style>
