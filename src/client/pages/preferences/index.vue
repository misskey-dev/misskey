<template>
<div>
	<portal to="icon"><fa :icon="faCog"/></portal>
	<portal to="title">{{ $t('clinetSettings') }}</portal>

	<router-link v-if="$store.getters.isSignedIn" class="_panel _buttonPrimary" to="/my/settings" style="margin-bottom: var(--margin);">{{ $t('accountSettings') }}</router-link>

	<x-theme/>

	<x-sidebar/>

	<x-plugins/>

	<section class="_card">
		<div class="_title"><fa :icon="faMusic"/> {{ $t('sounds') }}</div>
		<div class="_content">
			<mk-range v-model="sfxVolume" :min="0" :max="1" :step="0.1">
				<fa slot="icon" :icon="volumeIcon"/>
				<span slot="title">{{ $t('volume') }}</span>
			</mk-range>
		</div>
		<div class="_content">
			<mk-select v-model="sfxNote">
				<template #label>{{ $t('_sfx.note') }}</template>
				<option v-for="sound in sounds" :value="sound" :key="sound">{{ sound || $t('none') }}</option>
				<template #text><button class="_textButton" @click="listen(sfxNote)" v-if="sfxNote"><fa :icon="faPlay"/> {{ $t('listen') }}</button></template>
			</mk-select>
			<mk-select v-model="sfxNoteMy">
				<template #label>{{ $t('_sfx.noteMy') }}</template>
				<option v-for="sound in sounds" :value="sound" :key="sound">{{ sound || $t('none') }}</option>
				<template #text><button class="_textButton" @click="listen(sfxNoteMy)" v-if="sfxNoteMy"><fa :icon="faPlay"/> {{ $t('listen') }}</button></template>
			</mk-select>
			<mk-select v-model="sfxNotification">
				<template #label>{{ $t('_sfx.notification') }}</template>
				<option v-for="sound in sounds" :value="sound" :key="sound">{{ sound || $t('none') }}</option>
				<template #text><button class="_textButton" @click="listen(sfxNotification)" v-if="sfxNotification"><fa :icon="faPlay"/> {{ $t('listen') }}</button></template>
			</mk-select>
			<mk-select v-model="sfxChat">
				<template #label>{{ $t('_sfx.chat') }}</template>
				<option v-for="sound in sounds" :value="sound" :key="sound">{{ sound || $t('none') }}</option>
				<template #text><button class="_textButton" @click="listen(sfxChat)" v-if="sfxChat"><fa :icon="faPlay"/> {{ $t('listen') }}</button></template>
			</mk-select>
			<mk-select v-model="sfxChatBg">
				<template #label>{{ $t('_sfx.chatBg') }}</template>
				<option v-for="sound in sounds" :value="sound" :key="sound">{{ sound || $t('none') }}</option>
				<template #text><button class="_textButton" @click="listen(sfxChatBg)" v-if="sfxChatBg"><fa :icon="faPlay"/> {{ $t('listen') }}</button></template>
			</mk-select>
			<mk-select v-model="sfxAntenna">
				<template #label>{{ $t('_sfx.antenna') }}</template>
				<option v-for="sound in sounds" :value="sound" :key="sound">{{ sound || $t('none') }}</option>
				<template #text><button class="_textButton" @click="listen(sfxAntenna)" v-if="sfxAntenna"><fa :icon="faPlay"/> {{ $t('listen') }}</button></template>
			</mk-select>
		</div>
	</section>

	<section class="_card">
		<div class="_title"><fa :icon="faColumns"/> {{ $t('deck') }}</div>
		<div class="_content">
			<mk-switch v-model="deckAlwaysShowMainColumn">
				{{ $t('_deck.alwaysShowMainColumn') }}
			</mk-switch>
		</div>
		<div class="_content">
			<div>{{ $t('_deck.columnAlign') }}</div>
			<mk-radio v-model="deckColumnAlign" value="left">{{ $t('left') }}</mk-radio>
			<mk-radio v-model="deckColumnAlign" value="center">{{ $t('center') }}</mk-radio>
		</div>
	</section>

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
			<mk-switch v-model="enableInfiniteScroll">{{ $t('enableInfiniteScroll') }}</mk-switch>
			<mk-switch v-model="fixedWidgetsPosition">{{ $t('fixedWidgetsPosition') }}</mk-switch>
			<mk-switch v-model="disablePagesScript">{{ $t('disablePagesScript') }}</mk-switch>
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
import { faImage, faCog, faMusic, faPlay, faVolumeUp, faVolumeMute, faColumns } from '@fortawesome/free-solid-svg-icons';
import MkButton from '../../components/ui/button.vue';
import MkSwitch from '../../components/ui/switch.vue';
import MkSelect from '../../components/ui/select.vue';
import MkRadio from '../../components/ui/radio.vue';
import MkRange from '../../components/ui/range.vue';
import XTheme from './theme.vue';
import XSidebar from './sidebar.vue';
import XPlugins from './plugins.vue';
import { langs } from '../../config';
import { clientDb, set } from '../../db';

const sounds = [
	null,
	'syuilo/up',
	'syuilo/down',
	'syuilo/pope1',
	'syuilo/pope2',
	'syuilo/waon',
	'syuilo/popo',
	'syuilo/triple',
	'syuilo/poi1',
	'syuilo/poi2',
	'syuilo/pirori',
	'aisha/1',
	'aisha/2',
	'aisha/3',
	'noizenecio/kick_gaba',
];

export default Vue.extend({
	metaInfo() {
		return {
			title: this.$t('settings') as string
		};
	},

	components: {
		XTheme,
		XSidebar,
		XPlugins,
		MkButton,
		MkSwitch,
		MkSelect,
		MkRadio,
		MkRange,
	},

	data() {
		return {
			langs,
			lang: localStorage.getItem('lang'),
			fontSize: localStorage.getItem('fontSize'),
			sounds,
			faImage, faCog, faMusic, faPlay, faVolumeUp, faVolumeMute, faColumns
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

		disablePagesScript: {
			get() { return this.$store.state.device.disablePagesScript; },
			set(value) { this.$store.commit('device/set', { key: 'disablePagesScript', value }); }
		},

		showFixedPostForm: {
			get() { return this.$store.state.device.showFixedPostForm; },
			set(value) { this.$store.commit('device/set', { key: 'showFixedPostForm', value }); }
		},

		enableInfiniteScroll: {
			get() { return this.$store.state.device.enableInfiniteScroll; },
			set(value) { this.$store.commit('device/set', { key: 'enableInfiniteScroll', value }); }
		},

		fixedWidgetsPosition: {
			get() { return this.$store.state.device.fixedWidgetsPosition; },
			set(value) { this.$store.commit('device/set', { key: 'fixedWidgetsPosition', value }); }
		},

		deckAlwaysShowMainColumn: {
			get() { return this.$store.state.device.deckAlwaysShowMainColumn; },
			set(value) { this.$store.commit('device/set', { key: 'deckAlwaysShowMainColumn', value }); }
		},

		deckColumnAlign: {
			get() { return this.$store.state.device.deckColumnAlign; },
			set(value) { this.$store.commit('device/set', { key: 'deckColumnAlign', value }); }
		},

		sfxVolume: {
			get() { return this.$store.state.device.sfxVolume; },
			set(value) { this.$store.commit('device/set', { key: 'sfxVolume', value: parseFloat(value, 10) }); }
		},

		sfxNote: {
			get() { return this.$store.state.device.sfxNote; },
			set(value) { this.$store.commit('device/set', { key: 'sfxNote', value }); }
		},

		sfxNoteMy: {
			get() { return this.$store.state.device.sfxNoteMy; },
			set(value) { this.$store.commit('device/set', { key: 'sfxNoteMy', value }); }
		},

		sfxNotification: {
			get() { return this.$store.state.device.sfxNotification; },
			set(value) { this.$store.commit('device/set', { key: 'sfxNotification', value }); }
		},

		sfxChat: {
			get() { return this.$store.state.device.sfxChat; },
			set(value) { this.$store.commit('device/set', { key: 'sfxChat', value }); }
		},

		sfxChatBg: {
			get() { return this.$store.state.device.sfxChatBg; },
			set(value) { this.$store.commit('device/set', { key: 'sfxChatBg', value }); }
		},

		sfxAntenna: {
			get() { return this.$store.state.device.sfxAntenna; },
			set(value) { this.$store.commit('device/set', { key: 'sfxAntenna', value }); }
		},

		volumeIcon: {
			get() {
				return this.sfxVolume === 0 ? faVolumeMute : faVolumeUp;
			}
		}
	},

	watch: {
		lang() {
			const dialog = this.$root.dialog({
				type: 'waiting',
				iconOnly: true
			});

			localStorage.setItem('lang', this.lang);

			return set('_version_', `changeLang-${(new Date()).toJSON()}`, clientDb.i18n)
				.then(() => location.reload())
				.catch(() => {
					dialog.close();
					this.$root.dialog({
						type: 'error',
						iconOnly: true,
						autoClose: true
					});
				});
		},

		fontSize() {
			if (this.fontSize == null) {
				localStorage.removeItem('fontSize');
			} else {
				localStorage.setItem('fontSize', this.fontSize);
			}
			location.reload();
		},

		fixedWidgetsPosition() {
			location.reload()
		},

		enableInfiniteScroll() {
			location.reload()
		},
	},

	methods: {
		listen(sound) {
			const audio = new Audio(`/assets/sounds/${sound}.mp3`);
			audio.volume = this.$store.state.device.sfxVolume;
			audio.play();
		},

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
