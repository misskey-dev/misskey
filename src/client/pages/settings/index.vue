<template>
<div>
	<portal to="icon"><fa :icon="faCog"/></portal>
	<portal to="title">{{ $t('clinetSettings') }}</portal>

	<x-theme/>

	<section class="_card">
		<div class="_title"><fa :icon="faCog"/> {{ $t('accessibility') }}</div>
		<div class="_content">
			<mk-switch v-model="autoReload">
				{{ $t('autoReloadWhenDisconnected') }}
			</mk-switch>
		</div>
		<div class="_content">
			<mk-switch v-model="imageNewTab">{{ $t('openImageInNewTab') }}</mk-switch>
			<mk-switch v-model="disableAnimatedMfm">{{ $t('disableAnimatedMfm') }}</mk-switch>
			<mk-switch v-model="reduceAnimation">{{ $t('reduceUiAnimation') }}</mk-switch>
			<mk-switch v-model="useOsNativeEmojis">
				{{ $t('useOsNativeEmojis') }}
				<template #desc><mfm text="🍮🍦🍭🍩🍰🍫🍬🥞🍪"/></template>
			</mk-switch>
			<mk-switch v-model="showFixedPostForm">{{ $t('showFixedPostForm') }}</mk-switch>			
		</div>
		<div class="_content">
			<mk-select v-model="lang">
				<template #label>{{ $t('uiLanguage') }}</template>

				<option v-for="x in langs" :value="x[0]" :key="x[0]">{{ x[1] }}</option>
			</mk-select>
		</div>
		<div class="_content">
			<div>{{ $t('fontSize') }}</div>
			<mk-radio v-model="fontSize" value="small"><span style="font-size: 14px;">Aa</span></mk-radio>
			<mk-radio v-model="fontSize" :value="null"><span style="font-size: 16px;">Aa</span></mk-radio>
			<mk-radio v-model="fontSize" value="large"><span style="font-size: 18px;">Aa</span></mk-radio>
			<mk-radio v-model="fontSize" value="veryLarge"><span style="font-size: 20px;">Aa</span></mk-radio>
		</div>
	</section>

	<mk-button @click="cacheClear()" primary style="margin: var(--margin) auto;">{{ $t('cacheClear') }}</mk-button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faImage, faCog } from '@fortawesome/free-solid-svg-icons';
import MkInput from '../../components/ui/input.vue';
import MkButton from '../../components/ui/button.vue';
import MkSwitch from '../../components/ui/switch.vue';
import MkSelect from '../../components/ui/select.vue';
import MkRadio from '../../components/ui/radio.vue';
import XTheme from './theme.vue';
import i18n from '../../i18n';
import { langs } from '../../config';

export default Vue.extend({
	i18n,

	metaInfo() {
		return {
			title: this.$t('settings') as string
		};
	},

	components: {
		XTheme,
		MkInput,
		MkButton,
		MkSwitch,
		MkSelect,
		MkRadio,
	},

	data() {
		return {
			langs,
			lang: localStorage.getItem('lang'),
			fontSize: localStorage.getItem('fontSize'),
			faImage, faCog
		}
	},

	computed: {
		autoReload: {
			get() { return this.$store.state.device.autoReload; },
			set(value) { this.$store.commit('device/set', { key: 'autoReload', value }); }
		},

		reduceAnimation: {
			get() { return !this.$store.state.device.animation; },
			set(value) { this.$store.commit('device/set', { key: 'animation', value: !value }); }
		},

		disableAnimatedMfm: {
			get() { return !this.$store.state.device.animatedMfm; },
			set(value) { this.$store.commit('device/set', { key: 'animatedMfm', value: !value }); }
		},

		useOsNativeEmojis: {
			get() { return this.$store.state.device.useOsNativeEmojis; },
			set(value) { this.$store.commit('device/set', { key: 'useOsNativeEmojis', value }); }
		},

		imageNewTab: {
			get() { return this.$store.state.device.imageNewTab; },
			set(value) { this.$store.commit('device/set', { key: 'imageNewTab', value }); }
		},

		showFixedPostForm: {
			get() { return this.$store.state.device.showFixedPostForm; },
			set(value) { this.$store.commit('device/set', { key: 'showFixedPostForm', value }); }
		},
	},

	watch: {
		lang() {
			localStorage.setItem('lang', this.lang);
			localStorage.removeItem('locale');
			location.reload();
		},

		fontSize() {
			if (this.fontSize == null) {
				localStorage.removeItem('fontSize');
			} else {
				localStorage.setItem('fontSize', this.fontSize);
			}
			location.reload();
		},
	},

	methods: {
		cacheClear() {
			// Clear cache (service worker)
			try {
				navigator.serviceWorker.controller.postMessage('clear');

				navigator.serviceWorker.getRegistrations().then(registrations => {
					for (const registration of registrations) registration.unregister();
				});
			} catch (e) {
				console.error(e);
			}

			// Force reload
			location.reload(true);
		}
	}
});
</script>
