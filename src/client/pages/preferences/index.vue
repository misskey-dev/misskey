<template>
<div>
	<portal to="header"><Fa :icon="faCog"/>{{ $t('clinetSettings') }}</portal>

	<router-link v-if="$store.getters.isSignedIn" class="_panel _buttonPrimary" to="/my/settings" style="margin-bottom: var(--margin);">{{ $t('accountSettings') }}</router-link>

	<XTheme class="_vMargin"/>

	<XSidebar class="_vMargin"/>

	<XPlugins class="_vMargin"/>

	<section class="_card _vMargin">
		<div class="_title"><Fa :icon="faMusic"/> {{ $t('sounds') }}</div>
		<div class="_content">
			<MkRange v-model:value="sfxVolume" :min="0" :max="1" :step="0.1">
				<Fa slot="icon" :icon="volumeIcon"/>
				<span slot="title">{{ $t('volume') }}</span>
			</MkRange>
		</div>
		<div class="_content">
			<MkSelect v-model:value="sfxNote">
				<template #label>{{ $t('_sfx.note') }}</template>
				<option v-for="sound in sounds" :value="sound" :key="sound">{{ sound || $t('none') }}</option>
				<template #text><button class="_textButton" @click="listen(sfxNote)" v-if="sfxNote"><Fa :icon="faPlay"/> {{ $t('listen') }}</button></template>
			</MkSelect>
			<MkSelect v-model:value="sfxNoteMy">
				<template #label>{{ $t('_sfx.noteMy') }}</template>
				<option v-for="sound in sounds" :value="sound" :key="sound">{{ sound || $t('none') }}</option>
				<template #text><button class="_textButton" @click="listen(sfxNoteMy)" v-if="sfxNoteMy"><Fa :icon="faPlay"/> {{ $t('listen') }}</button></template>
			</MkSelect>
			<MkSelect v-model:value="sfxNotification">
				<template #label>{{ $t('_sfx.notification') }}</template>
				<option v-for="sound in sounds" :value="sound" :key="sound">{{ sound || $t('none') }}</option>
				<template #text><button class="_textButton" @click="listen(sfxNotification)" v-if="sfxNotification"><Fa :icon="faPlay"/> {{ $t('listen') }}</button></template>
			</MkSelect>
			<MkSelect v-model:value="sfxChat">
				<template #label>{{ $t('_sfx.chat') }}</template>
				<option v-for="sound in sounds" :value="sound" :key="sound">{{ sound || $t('none') }}</option>
				<template #text><button class="_textButton" @click="listen(sfxChat)" v-if="sfxChat"><Fa :icon="faPlay"/> {{ $t('listen') }}</button></template>
			</MkSelect>
			<MkSelect v-model:value="sfxChatBg">
				<template #label>{{ $t('_sfx.chatBg') }}</template>
				<option v-for="sound in sounds" :value="sound" :key="sound">{{ sound || $t('none') }}</option>
				<template #text><button class="_textButton" @click="listen(sfxChatBg)" v-if="sfxChatBg"><Fa :icon="faPlay"/> {{ $t('listen') }}</button></template>
			</MkSelect>
			<MkSelect v-model:value="sfxAntenna">
				<template #label>{{ $t('_sfx.antenna') }}</template>
				<option v-for="sound in sounds" :value="sound" :key="sound">{{ sound || $t('none') }}</option>
				<template #text><button class="_textButton" @click="listen(sfxAntenna)" v-if="sfxAntenna"><Fa :icon="faPlay"/> {{ $t('listen') }}</button></template>
			</MkSelect>
			<MkSelect v-model:value="sfxChannel">
				<template #label>{{ $t('_sfx.channel') }}</template>
				<option v-for="sound in sounds" :value="sound" :key="sound">{{ sound || $t('none') }}</option>
				<template #text><button class="_textButton" @click="listen(sfxChannel)" v-if="sfxChannel"><Fa :icon="faPlay"/> {{ $t('listen') }}</button></template>
			</MkSelect>
		</div>
	</section>

	<section class="_card _vMargin">
		<div class="_title"><Fa :icon="faColumns"/> {{ $t('deck') }}</div>
		<div class="_content">
			<MkSwitch v-model:value="deckAlwaysShowMainColumn">
				{{ $t('_deck.alwaysShowMainColumn') }}
			</MkSwitch>
		</div>
		<div class="_content">
			<div>{{ $t('_deck.columnAlign') }}</div>
			<MkRadio v-model:value="deckColumnAlign" value="left">{{ $t('left') }}</MkRadio>
			<MkRadio v-model:value="deckColumnAlign" value="center">{{ $t('center') }}</MkRadio>
		</div>
	</section>

	<section class="_card _vMargin">
		<div class="_title"><Fa :icon="faCog"/> {{ $t('appearance') }}</div>
		<div class="_content">
			<MkSwitch v-model:value="disableAnimatedMfm">{{ $t('disableAnimatedMfm') }}</MkSwitch>
			<MkSwitch v-model:value="reduceAnimation">{{ $t('reduceUiAnimation') }}</MkSwitch>
			<MkSwitch v-model:value="useBlurEffectForModal">{{ $t('useBlurEffectForModal') }}</MkSwitch>
			<MkSwitch v-model:value="useOsNativeEmojis">
				{{ $t('useOsNativeEmojis') }}
				<template #desc><mfm text="🍮🍦🍭🍩🍰🍫🍬🥞🍪"/></template>
			</MkSwitch>
		</div>
		<div class="_content">
			<div>{{ $t('fontSize') }}</div>
			<MkRadio v-model:value="fontSize" value="small"><span style="font-size: 14px;">Aa</span></MkRadio>
			<MkRadio v-model:value="fontSize" :value="null"><span style="font-size: 16px;">Aa</span></MkRadio>
			<MkRadio v-model:value="fontSize" value="large"><span style="font-size: 18px;">Aa</span></MkRadio>
			<MkRadio v-model:value="fontSize" value="veryLarge"><span style="font-size: 20px;">Aa</span></MkRadio>
		</div>
	</section>

	<section class="_card _vMargin">
		<div class="_title"><Fa :icon="faCog"/> {{ $t('general') }}</div>
		<div class="_content">
			<div>{{ $t('whenServerDisconnected') }}</div>
			<MkRadio v-model:value="serverDisconnectedBehavior" value="reload">{{ $t('_serverDisconnectedBehavior.reload') }}</MkRadio>
			<MkRadio v-model:value="serverDisconnectedBehavior" value="dialog">{{ $t('_serverDisconnectedBehavior.dialog') }}</MkRadio>
			<MkRadio v-model:value="serverDisconnectedBehavior" value="quiet">{{ $t('_serverDisconnectedBehavior.quiet') }}</MkRadio>
		</div>
		<div class="_content">
			<MkSwitch v-model:value="imageNewTab">{{ $t('openImageInNewTab') }}</MkSwitch>
			<MkSwitch v-model:value="showFixedPostForm">{{ $t('showFixedPostForm') }}</MkSwitch>
			<MkSwitch v-model:value="enableInfiniteScroll">{{ $t('enableInfiniteScroll') }}</MkSwitch>
			<MkSwitch v-model:value="fixedWidgetsPosition">{{ $t('fixedWidgetsPosition') }}</MkSwitch>
			<MkSwitch v-model:value="disablePagesScript">{{ $t('disablePagesScript') }}</MkSwitch>
		</div>
		<div class="_content">
			<MkSelect v-model:value="lang">
				<template #label>{{ $t('uiLanguage') }}</template>

				<option v-for="x in langs" :value="x[0]" :key="x[0]">{{ x[1] }}</option>
			</MkSelect>
		</div>
	</section>

	<MkButton @click="cacheClear()" primary style="margin: var(--margin) auto;">{{ $t('cacheClear') }}</MkButton>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faImage, faCog, faMusic, faPlay, faVolumeUp, faVolumeMute, faColumns } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkSwitch from '@/components/ui/switch.vue';
import MkSelect from '@/components/ui/select.vue';
import MkRadio from '@/components/ui/radio.vue';
import MkRange from '@/components/ui/range.vue';
import XTheme from './theme.vue';
import XSidebar from './sidebar.vue';
import XPlugins from './plugins.vue';
import { langs } from '@/config';
import { clientDb, set } from '../../db';
import * as os from '@/os';

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
	'syuilo/pirori-wet',
	'syuilo/pirori-square-wet',
	'syuilo/square-pico',
	'syuilo/reverved',
	'syuilo/ryukyu',
	'aisha/1',
	'aisha/2',
	'aisha/3',
	'noizenecio/kick_gaba',
	'noizenecio/kick_gaba2',
];

export default defineComponent({
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
		serverDisconnectedBehavior: {
			get() { return this.$store.state.device.serverDisconnectedBehavior; },
			set(value) { this.$store.commit('device/set', { key: 'serverDisconnectedBehavior', value }); }
		},

		reduceAnimation: {
			get() { return !this.$store.state.device.animation; },
			set(value) { this.$store.commit('device/set', { key: 'animation', value: !value }); }
		},

		useBlurEffectForModal: {
			get() { return this.$store.state.device.useBlurEffectForModal; },
			set(value) { this.$store.commit('device/set', { key: 'useBlurEffectForModal', value: value }); }
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

		sfxChannel: {
			get() { return this.$store.state.device.sfxChannel; },
			set(value) { this.$store.commit('device/set', { key: 'sfxChannel', value }); }
		},

		volumeIcon: {
			get() {
				return this.sfxVolume === 0 ? faVolumeMute : faVolumeUp;
			}
		}
	},

	watch: {
		lang() {
			const dialog = os.dialog({
				type: 'waiting',
				iconOnly: true
			});

			localStorage.setItem('lang', this.lang);

			return set('_version_', `changeLang-${(new Date()).toJSON()}`, clientDb.i18n)
				.then(() => location.reload())
				.catch(() => {
					dialog.close();
					os.dialog({
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
