<template>
<mk-ui>
	<span slot="header">%fa:cog%%i18n:@settings%</span>
	<main>
		<p v-html="'%i18n:@signed-in-as%'.replace('{}', '<b>' + name + '</b>')"></p>
		<div>
			<x-profile/>

			<md-card>
				<md-card-header>
					<div class="md-title">%fa:palette% %i18n:@design%</div>
				</md-card-header>

				<md-card-content>
					<div>
						<md-switch v-model="darkmode">%i18n:@dark-mode%</md-switch>
					</div>

					<div>
						<md-switch v-model="clientSettings.circleIcons" @change="onChangeCircleIcons">%i18n:@circle-icons%</md-switch>
					</div>

					<div>
						<div class="md-body-2">%i18n:@timeline%</div>

						<div>
							<md-switch v-model="clientSettings.showReplyTarget" @change="onChangeShowReplyTarget">%i18n:@show-reply-target%</md-switch>
						</div>

						<div>
							<md-switch v-model="clientSettings.showMyRenotes" @change="onChangeShowMyRenotes">%i18n:@show-my-renotes%</md-switch>
						</div>

						<div>
							<md-switch v-model="clientSettings.showRenotedMyNotes" @change="onChangeShowRenotedMyNotes">%i18n:@show-renoted-my-notes%</md-switch>
						</div>
					</div>

					<div>
						<div class="md-body-2">%i18n:@post-style%</div>

						<md-radio v-model="postStyle" value="standard">%i18n:@post-style-standard%</md-radio>
						<md-radio v-model="postStyle" value="smart">%i18n:@post-style-smart%</md-radio>
					</div>
				</md-card-content>
			</md-card>

			<md-card>
				<md-card-header>
					<div class="md-title">%fa:cog% %i18n:@behavior%</div>
				</md-card-header>

				<md-card-content>
					<div>
						<md-switch v-model="clientSettings.fetchOnScroll" @change="onChangeFetchOnScroll">%i18n:@fetch-on-scroll%</md-switch>
					</div>

					<div>
						<md-switch v-model="clientSettings.disableViaMobile" @change="onChangeDisableViaMobile">%i18n:@disable-via-mobile%</md-switch>
					</div>

					<div>
						<md-switch v-model="loadRawImages">%i18n:@load-raw-images%</md-switch>
					</div>

					<div>
						<md-switch v-model="clientSettings.loadRemoteMedia" @change="onChangeLoadRemoteMedia">%i18n:@load-remote-media%</md-switch>
					</div>

					<div>
						<md-switch v-model="lightmode">%i18n:@i-am-under-limited-internet%</md-switch>
					</div>
				</md-card-content>
			</md-card>

			<md-card>
				<md-card-header>
					<div class="md-title">%fa:language% %i18n:@lang%</div>
				</md-card-header>

				<md-card-content>
					<md-field>
						<md-select v-model="lang" placeholder="%i18n:@auto%">
							<md-optgroup label="%i18n:@recommended%">
								<md-option value="">%i18n:@auto%</md-option>
							</md-optgroup>

							<md-optgroup label="%i18n:@specify-language%">
								<md-option v-for="x in langs" :value="x[0]" :key="x[0]">{{ x[1] }}</md-option>
							</md-optgroup>
						</md-select>
					</md-field>
					<span class="md-helper-text">%fa:info-circle% %i18n:@lang-tip%</span>
				</md-card-content>
			</md-card>

			<md-card>
				<md-card-header>
					<div class="md-title">%fa:B twitter% %i18n:@twitter%</div>
				</md-card-header>

				<md-card-content>
					<p class="account" v-if="os.i.twitter"><a :href="`https://twitter.com/${os.i.twitter.screenName}`" target="_blank">@{{ os.i.twitter.screenName }}</a></p>
					<p>
						<a :href="`${apiUrl}/connect/twitter`" target="_blank">{{ os.i.twitter ? '%i18n:@twitter-reconnect%' : '%i18n:@twitter-connect%' }}</a>
						<span v-if="os.i.twitter"> or </span>
						<a :href="`${apiUrl}/disconnect/twitter`" target="_blank" v-if="os.i.twitter">%i18n:@twitter-disconnect%</a>
					</p>
				</md-card-content>
			</md-card>

			<md-card>
				<md-card-header>
					<div class="md-title">%fa:sync-alt% %i18n:@update%</div>
				</md-card-header>

				<md-card-content>
					<div>%i18n:@version% <i>{{ version }}</i></div>
					<template v-if="latestVersion !== undefined">
						<div>%i18n:@latest-version% <i>{{ latestVersion ? latestVersion : version }}</i></div>
					</template>
					<md-button class="md-raised md-primary" @click="checkForUpdate" :disabled="checkingForUpdate">
						<template v-if="checkingForUpdate">%i18n:@update-checking%<mk-ellipsis/></template>
						<template v-else>%i18n:@check-for-updates%</template>
					</md-button>
				</md-card-content>
			</md-card>
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
			return Vue.filter('userName')((this as any).os.i);
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
	padding 0 16px
	margin 0 auto
	max-width 500px
	width 100%

	> div
		> *
			margin-bottom 16px

	> p
		display block
		margin 24px
		text-align center
		color isDark ? #cad2da : #a2a9b1

main[data-darkmode]
	root(true)

main:not([data-darkmode])
	root(false)

</style>
