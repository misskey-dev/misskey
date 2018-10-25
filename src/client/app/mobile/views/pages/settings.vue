<template>
<mk-ui>
	<span slot="header"><span style="margin-right:4px;">%fa:cog%</span>%i18n:@settings%</span>
	<main>
		<div class="signin-as" v-html="'%i18n:@signed-in-as%'.replace('{}', `<b>${name}</b>`)"></div>

		<div>
			<mk-profile-editor/>

			<ui-card>
				<div slot="title">%fa:palette% %i18n:@theme%</div>
				<section>
					<mk-theme/>
				</section>
			</ui-card>

			<ui-card>
				<div slot="title">%fa:poll-h% %i18n:@design%</div>

				<section>
					<ui-switch v-model="darkmode">%i18n:@dark-mode%</ui-switch>
					<ui-switch v-model="circleIcons">%i18n:@circle-icons%</ui-switch>
					<ui-switch v-model="reduceMotion">%i18n:common.reduce-motion% (%i18n:common.this-setting-is-this-device-only%)</ui-switch>
					<ui-switch v-model="contrastedAcct">%i18n:@contrasted-acct%</ui-switch>
					<ui-switch v-model="showFullAcct">%i18n:common.show-full-acct%</ui-switch>
					<ui-switch v-model="iLikeSushi">%i18n:common.i-like-sushi%</ui-switch>
					<ui-switch v-model="disableAnimatedMfm">%i18n:common.disable-animated-mfm%</ui-switch>
					<ui-switch v-model="alwaysShowNsfw">%i18n:common.always-show-nsfw% (%i18n:common.this-setting-is-this-device-only%)</ui-switch>
					<ui-switch v-model="games_reversi_showBoardLabels">%i18n:common.show-reversi-board-labels%</ui-switch>
					<ui-switch v-model="games_reversi_useContrastStones">%i18n:common.use-contrast-reversi-stones%</ui-switch>
				</section>

				<section>
					<header>%i18n:@timeline%</header>
					<div>
						<ui-switch v-model="showReplyTarget">%i18n:@show-reply-target%</ui-switch>
						<ui-switch v-model="showMyRenotes">%i18n:@show-my-renotes%</ui-switch>
						<ui-switch v-model="showRenotedMyNotes">%i18n:@show-renoted-my-notes%</ui-switch>
						<ui-switch v-model="showLocalRenotes">%i18n:@show-local-renotes%</ui-switch>
					</div>
				</section>

				<section>
					<header>%i18n:@post-style%</header>
					<ui-radio v-model="postStyle" value="standard">%i18n:@post-style-standard%</ui-radio>
					<ui-radio v-model="postStyle" value="smart">%i18n:@post-style-smart%</ui-radio>
				</section>

				<section>
					<header>%i18n:@notification-position%</header>
					<ui-radio v-model="mobileNotificationPosition" value="bottom">%i18n:@notification-position-bottom%</ui-radio>
					<ui-radio v-model="mobileNotificationPosition" value="top">%i18n:@notification-position-top%</ui-radio>
				</section>
			</ui-card>

			<ui-card>
				<div slot="title">%fa:sliders-h% %i18n:@behavior%</div>

				<section>
					<ui-switch v-model="fetchOnScroll">%i18n:@fetch-on-scroll%</ui-switch>
					<ui-switch v-model="disableViaMobile">%i18n:@disable-via-mobile%</ui-switch>
					<ui-switch v-model="loadRawImages">%i18n:@load-raw-images%</ui-switch>
					<ui-switch v-model="loadRemoteMedia">%i18n:@load-remote-media%</ui-switch>
					<ui-switch v-model="lightmode">%i18n:@i-am-under-limited-internet%</ui-switch>
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

			<mk-drive-settings/>

			<ui-card>
				<div slot="title">%fa:volume-up% %i18n:@sound%</div>

				<section>
					<ui-switch v-model="enableSounds">%i18n:@enable-sounds%</ui-switch>
				</section>
			</ui-card>

			<ui-card>
				<div slot="title">%fa:language% %i18n:@lang%</div>

				<section class="fit-top">
					<ui-select v-model="lang" placeholder="%i18n:@auto%">
						<optgroup label="%i18n:@recommended%">
							<option value="">%i18n:@auto%</option>
						</optgroup>

						<optgroup label="%i18n:@specify-language%">
							<option v-for="x in langs" :value="x[0]" :key="x[0]">{{ x[1] }}</option>
						</optgroup>
					</ui-select>
					<span>%fa:info-circle% %i18n:@lang-tip%</span>
				</section>
			</ui-card>

			<ui-card>
				<div slot="title">%fa:B twitter% %i18n:@twitter%</div>

				<section>
					<p class="account" v-if="$store.state.i.twitter"><a :href="`https://twitter.com/${$store.state.i.twitter.screenName}`" target="_blank">@{{ $store.state.i.twitter.screenName }}</a></p>
					<p>
						<a :href="`${apiUrl}/connect/twitter`" target="_blank">{{ $store.state.i.twitter ? '%i18n:@twitter-reconnect%' : '%i18n:@twitter-connect%' }}</a>
						<span v-if="$store.state.i.twitter"> or </span>
						<a :href="`${apiUrl}/disconnect/twitter`" target="_blank" v-if="$store.state.i.twitter">%i18n:@twitter-disconnect%</a>
					</p>
				</section>
			</ui-card>

			<mk-api-settings />

			<ui-card>
				<div slot="title">%fa:sync-alt% %i18n:@update%</div>

				<section>
					<div>%i18n:@version% <i>{{ version }}</i></div>
					<template v-if="latestVersion !== undefined">
						<div>%i18n:@latest-version% <i>{{ latestVersion ? latestVersion : version }}</i></div>
					</template>
					<ui-button @click="checkForUpdate" :disabled="checkingForUpdate">
						<template v-if="checkingForUpdate">%i18n:@update-checking%<mk-ellipsis/></template>
						<template v-else>%i18n:@check-for-updates%</template>
					</ui-button>
				</section>
			</ui-card>
		</div>

		<div class="signout" @click="signout">%i18n:@signout%</div>

		<footer>
			<small>ver {{ version }} ({{ codename }})</small>
		</footer>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import { apiUrl, version, codename, langs } from '../../../config';
import checkForUpdate from '../../../common/scripts/check-for-update';

export default Vue.extend({
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
		document.title = '%i18n:@settings%';
	},

	methods: {
		signout() {
			(this as any).os.signout();
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
