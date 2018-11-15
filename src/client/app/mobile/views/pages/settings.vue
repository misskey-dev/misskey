<template>
<mk-ui>
	<span slot="header"><span style="margin-right:4px;"><fa icon="cog"/></span>{{ $t('settings') }}</span>
	<main>
		<div class="signin-as" v-html="this.$t('signed-in-as').replace('{}', `<b>${name}</b>`)"></div>

		<div>
			<x-profile-editor/>

			<ui-card>
				<div slot="title"><fa icon="palette"/> {{ $t('theme') }}</div>
				<section>
					<x-theme/>
				</section>
			</ui-card>

			<ui-card>
				<div slot="title"><fa icon="poll-h"/> {{ $t('design') }}</div>

				<section>
					<ui-switch v-model="darkmode">{{ $t('dark-mode') }}</ui-switch>
					<ui-switch v-model="circleIcons">{{ $t('circle-icons') }}</ui-switch>
					<ui-switch v-model="reduceMotion">{{ $t('@.reduce-motion') }} ({{ $t('@.this-setting-is-this-device-only') }})</ui-switch>
					<ui-switch v-model="contrastedAcct">{{ $t('contrasted-acct') }}</ui-switch>
					<ui-switch v-model="showFullAcct">{{ $t('@.show-full-acct') }}</ui-switch>
					<ui-switch v-model="showVia">{{ $t('@.show-via') }}</ui-switch>
					<ui-switch v-model="useOsDefaultEmojis">{{ $t('@.use-os-default-emojis') }}</ui-switch>
					<ui-switch v-model="iLikeSushi">{{ $t('@.i-like-sushi') }}</ui-switch>
					<ui-switch v-model="disableAnimatedMfm">{{ $t('@.disable-animated-mfm') }}</ui-switch>
					<ui-switch v-model="alwaysShowNsfw">{{ $t('@.always-show-nsfw') }} ({{ $t('@.this-setting-is-this-device-only') }})</ui-switch>
				</section>

				<section>
					<ui-switch v-model="games_reversi_showBoardLabels">{{ $t('@.show-reversi-board-labels') }}</ui-switch>
					<ui-switch v-model="games_reversi_useContrastStones">{{ $t('@.use-contrast-reversi-stones') }}</ui-switch>
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
			</ui-card>

			<ui-card>
				<div slot="title"><fa icon="sliders-h"/> {{ $t('behavior') }}</div>

				<section>
					<ui-switch v-model="fetchOnScroll">{{ $t('fetch-on-scroll') }}</ui-switch>
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
							<option value="private">{{ $t('@.note-visibility.private') }}</option>
						</ui-select>
					</section>
				</section>
			</ui-card>

			<x-drive-settings/>

			<x-mute-and-block/>

			<ui-card>
				<div slot="title"><fa icon="volume-up"/> {{ $t('sound') }}</div>

				<section>
					<ui-switch v-model="enableSounds">{{ $t('enable-sounds') }}</ui-switch>
				</section>
			</ui-card>

			<ui-card>
				<div slot="title"><fa icon="language"/> {{ $t('lang') }}</div>

				<section class="fit-top">
					<ui-select v-model="lang" :placeholder="$t('auto')">
						<optgroup :label="$t('recommended')">
							<option value="">{{ $t('auto') }}</option>
						</optgroup>

						<optgroup :label="$t('specify-language')">
							<option v-for="x in langs" :value="x[0]" :key="x[0]">{{ x[1] }}</option>
						</optgroup>
					</ui-select>
					<span><fa icon="info-circle"/> {{ $t('lang-tip') }}</span>
				</section>
			</ui-card>

			<ui-card>
				<div slot="title"><fa :icon="['fab', 'twitter']"/> {{ $t('twitter') }}</div>

				<section>
					<p class="account" v-if="$store.state.i.twitter"><a :href="`https://twitter.com/${$store.state.i.twitter.screenName}`" target="_blank">@{{ $store.state.i.twitter.screenName }}</a></p>
					<p>
						<a :href="`${apiUrl}/connect/twitter`" target="_blank">{{ $store.state.i.twitter ? this.$t('twitter-reconnect') : this.$t('twitter-connect') }}</a>
						<span v-if="$store.state.i.twitter"> or </span>
						<a :href="`${apiUrl}/disconnect/twitter`" target="_blank" v-if="$store.state.i.twitter">{{ $t('twitter-disconnect') }}</a>
					</p>
				</section>
			</ui-card>

			<ui-card>
				<div slot="title"><fa :icon="['fab', 'github']"/> {{ $t('github') }}</div>

				<section>
					<p class="account" v-if="$store.state.i.github"><a :href="`https://github.com/${$store.state.i.github.login}`" target="_blank">@{{ $store.state.i.github.login }}</a></p>
					<p>
						<a :href="`${apiUrl}/connect/github`" target="_blank">{{ $store.state.i.github ? this.$t('github-reconnect') : this.$t('github-connect') }}</a>
						<span v-if="$store.state.i.github"> or </span>
						<a :href="`${apiUrl}/disconnect/github`" target="_blank" v-if="$store.state.i.github">{{ $t('github-disconnect') }}</a>
					</p>
				</section>
			</ui-card>

			<ui-card>
				<div slot="title"><fa :icon="['fab', 'discord']"/> {{ $t('discord') }}</div>

				<section>
					<p class="account" v-if="$store.state.i.discord"><a :href="`https://discordapp.com/users/${$store.state.i.discord.id}`" target="_blank">@{{ $store.state.i.discord.username }}#{{ $store.state.i.discord.discriminator }}</a></p>
					<p>
						<a :href="`${apiUrl}/connect/discord`" target="_blank">{{ $store.state.i.discord ? this.$t('discord-reconnect') : this.$t('discord-connect') }}</a>
						<span v-if="$store.state.i.discord"> or </span>
						<a :href="`${apiUrl}/disconnect/discord`" target="_blank" v-if="$store.state.i.discord">{{ $t('discord-disconnect') }}</a>
					</p>
				</section>
			</ui-card>

			<x-api-settings />

			<ui-card>
				<div slot="title"><fa icon="unlock-alt"/> {{ $t('password') }}</div>
				<section>
					<x-password-settings/>
				</section>
			</ui-card>

			<ui-card>
				<div slot="title"><fa icon="sync-alt"/> {{ $t('update') }}</div>

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

		<div class="signout" @click="signout">{{ $t('signout') }}</div>

		<footer>
			<small>ver {{ version }} ({{ codename }})</small>
		</footer>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { apiUrl, clientVersion as version, codename, langs } from '../../../config';
import checkForUpdate from '../../../common/scripts/check-for-update';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/settings.vue'),

	components: {
		XTheme: () => import('../../../common/views/components/theme.vue').then(m => m.default),
		XDriveSettings: () => import('../../../common/views/components/drive-settings.vue').then(m => m.default),
		XMuteAndBlock: () => import('../../../common/views/components/mute-and-block.vue').then(m => m.default),
		XPasswordSettings: () => import('../../../common/views/components/password-settings.vue').then(m => m.default),
		XProfileEditor: () => import('../../../common/views/components/profile-editor.vue').then(m => m.default),
		XApiSettings: () => import('../../../common/views/components/api-settings.vue').then(m => m.default),
	},

	data() {
		return {
			apiUrl,
			version,
			codename,
			langs,
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

		useOsDefaultEmojis: {
			get() { return this.$store.state.device.useOsDefaultEmojis; },
			set(value) { this.$store.commit('device/set', { key: 'useOsDefaultEmojis', value }); }
		},

		reduceMotion: {
			get() { return this.$store.state.device.reduceMotion; },
			set(value) { this.$store.commit('device/set', { key: 'reduceMotion', value }); }
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

		lang: {
			get() { return this.$store.state.device.lang; },
			set(value) { this.$store.commit('device/set', { key: 'lang', value }); }
		},

		enableSounds: {
			get() { return this.$store.state.device.enableSounds; },
			set(value) { this.$store.commit('device/set', { key: 'enableSounds', value }); }
		},

		fetchOnScroll: {
			get() { return this.$store.state.settings.fetchOnScroll; },
			set(value) { this.$store.dispatch('settings/set', { key: 'fetchOnScroll', value }); }
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
		}
	}
});
</script>

<style lang="stylus" scoped>
main
	margin 0 auto
	max-width 600px
	width 100%

	> .signin-as
		margin 16px
		padding 16px
		text-align center
		color var(--mobileSignedInAsFg)
		background var(--mobileSignedInAsBg)
		box-shadow 0 3px 1px -2px rgba(#000, 0.2), 0 2px 2px 0 rgba(#000, 0.14), 0 1px 5px 0 rgba(#000, 0.12)

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
