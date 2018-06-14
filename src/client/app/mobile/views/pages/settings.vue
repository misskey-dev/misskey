<template>
<mk-ui>
	<span slot="header">%fa:cog%%i18n:@settings%</span>
	<main>
		<p v-html="'%i18n:@signed-in-as%'.replace('{}', '<b>' + name + '</b>')"></p>
		<div>
			<x-profile/>

			<ui-card>
				<div slot="title">%fa:palette% %i18n:@design%</div>

				<div>
					<ui-switch v-model="darkmode">%i18n:@dark-mode%</ui-switch>
				</div>

				<div>
					<ui-switch v-model="$store.state.settings.circleIcons" @change="onChangeCircleIcons">%i18n:@circle-icons%</ui-switch>
				</div>

				<div>
					<div class="md-body-2">%i18n:@timeline%</div>

					<div>
						<ui-switch v-model="$store.state.settings.showReplyTarget" @change="onChangeShowReplyTarget">%i18n:@show-reply-target%</ui-switch>
					</div>

					<div>
						<ui-switch v-model="$store.state.settings.showMyRenotes" @change="onChangeShowMyRenotes">%i18n:@show-my-renotes%</ui-switch>
					</div>

					<div>
						<ui-switch v-model="$store.state.settings.showRenotedMyNotes" @change="onChangeShowRenotedMyNotes">%i18n:@show-renoted-my-notes%</ui-switch>
					</div>
				</div>

				<div>
					<div class="md-body-2">%i18n:@post-style%</div>

					<ui-radio v-model="postStyle" value="standard">%i18n:@post-style-standard%</ui-radio>
					<ui-radio v-model="postStyle" value="smart">%i18n:@post-style-smart%</ui-radio>
				</div>
			</ui-card>

			<ui-card>
				<div slot="title">%fa:cog% %i18n:@behavior%</div>

				<div>
					<ui-switch v-model="$store.state.settings.fetchOnScroll" @change="onChangeFetchOnScroll">%i18n:@fetch-on-scroll%</ui-switch>
				</div>

				<div>
					<ui-switch v-model="$store.state.settings.disableViaMobile" @change="onChangeDisableViaMobile">%i18n:@disable-via-mobile%</ui-switch>
				</div>

				<div>
					<ui-switch v-model="loadRawImages">%i18n:@load-raw-images%</ui-switch>
				</div>

				<div>
					<ui-switch v-model="$store.state.settings.loadRemoteMedia" @change="onChangeLoadRemoteMedia">%i18n:@load-remote-media%</ui-switch>
				</div>

				<div>
					<ui-switch v-model="lightmode">%i18n:@i-am-under-limited-internet%</ui-switch>
				</div>
			</ui-card>

			<ui-card>
				<div slot="title">%fa:language% %i18n:@lang%</div>

				<ui-select v-model="lang" placeholder="%i18n:@auto%">
					<optgroup label="%i18n:@recommended%">
						<option value="">%i18n:@auto%</option>
					</optgroup>

					<optgroup label="%i18n:@specify-language%">
						<option v-for="x in langs" :value="x[0]" :key="x[0]">{{ x[1] }}</option>
					</optgroup>
				</ui-select>
				<span class="md-helper-text">%fa:info-circle% %i18n:@lang-tip%</span>
			</ui-card>

			<ui-card>
				<div slot="title">%fa:B twitter% %i18n:@twitter%</div>

				<p class="account" v-if="$store.state.i.twitter"><a :href="`https://twitter.com/${$store.state.i.twitter.screenName}`" target="_blank">@{{ $store.state.i.twitter.screenName }}</a></p>
				<p>
					<a :href="`${apiUrl}/connect/twitter`" target="_blank">{{ $store.state.i.twitter ? '%i18n:@twitter-reconnect%' : '%i18n:@twitter-connect%' }}</a>
					<span v-if="$store.state.i.twitter"> or </span>
					<a :href="`${apiUrl}/disconnect/twitter`" target="_blank" v-if="$store.state.i.twitter">%i18n:@twitter-disconnect%</a>
				</p>
			</ui-card>

			<ui-card>
				<div slot="title">%fa:sync-alt% %i18n:@update%</div>

				<div>%i18n:@version% <i>{{ version }}</i></div>
				<template v-if="latestVersion !== undefined">
					<div>%i18n:@latest-version% <i>{{ latestVersion ? latestVersion : version }}</i></div>
				</template>
				<md-button class="md-raised md-primary" @click="checkForUpdate" :disabled="checkingForUpdate">
					<template v-if="checkingForUpdate">%i18n:@update-checking%<mk-ellipsis/></template>
					<template v-else>%i18n:@check-for-updates%</template>
				</md-button>
			</ui-card>
		</div>
		<p><small>ver {{ version }} ({{ codename }})</small></p>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import { apiUrl, version, codename, langs } from '../../../config';
import checkForUpdate from '../../../common/scripts/check-for-update';

import XProfile from './settings/settings.profile.vue';

export default Vue.extend({
	components: {
		XProfile
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

		postStyle: {
			get() { return this.$store.state.device.postStyle; },
			set(value) { this.$store.commit('device/set', { key: 'postStyle', value }); }
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
	},

	mounted() {
		document.title = 'Misskey | %i18n:@settings%';
	},

	methods: {
		signout() {
			(this as any).os.signout();
		},

		onChangeFetchOnScroll(v) {
			this.$store.dispatch('settings/set', {
				key: 'fetchOnScroll',
				value: v
			});
		},

		onChangeDisableViaMobile(v) {
			this.$store.dispatch('settings/set', {
				key: 'disableViaMobile',
				value: v
			});
		},

		onChangeLoadRemoteMedia(v) {
			this.$store.dispatch('settings/set', {
				key: 'loadRemoteMedia',
				value: v
			});
		},

		onChangeCircleIcons(v) {
			this.$store.dispatch('settings/set', {
				key: 'circleIcons',
				value: v
			});
		},

		onChangeShowReplyTarget(v) {
			this.$store.dispatch('settings/set', {
				key: 'showReplyTarget',
				value: v
			});
		},

		onChangeShowMyRenotes(v) {
			this.$store.dispatch('settings/set', {
				key: 'showMyRenotes',
				value: v
			});
		},

		onChangeShowRenotedMyNotes(v) {
			this.$store.dispatch('settings/set', {
				key: 'showRenotedMyNotes',
				value: v
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
		}
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	margin 0 auto
	max-width 500px
	width 100%

	> p
		display block
		margin 16px 0
		padding 16px
		text-align center
		color isDark ? #cad2da : #2c662d
		background #fcfff5

main[data-darkmode]
	root(true)

main:not([data-darkmode])
	root(false)

</style>
