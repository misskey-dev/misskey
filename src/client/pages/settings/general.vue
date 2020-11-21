<template>
<FormBase>
	<FormSwitch v-model:value="showFixedPostForm">{{ $t('showFixedPostForm') }}</FormSwitch>

	<FormSelect v-model:value="lang">
		<template #label>{{ $t('uiLanguage') }}</template>
		<option v-for="x in langs" :value="x[0]" :key="x[0]">{{ x[1] }}</option>
	</FormSelect>

	<FormGroup>
		<template #label>{{ $t('behavior') }}</template>
		<FormSwitch v-model:value="imageNewTab">{{ $t('openImageInNewTab') }}</FormSwitch>
		<FormSwitch v-model:value="enableInfiniteScroll">{{ $t('enableInfiniteScroll') }}</FormSwitch>
		<FormSwitch v-model:value="disablePagesScript">{{ $t('disablePagesScript') }}</FormSwitch>
	</FormGroup>

	<FormRadios v-model="serverDisconnectedBehavior">
		<template #desc>{{ $t('whenServerDisconnected') }}</template>
		<option value="reload">{{ $t('_serverDisconnectedBehavior.reload') }}</option>
		<option value="dialog">{{ $t('_serverDisconnectedBehavior.dialog') }}</option>
		<option value="quiet">{{ $t('_serverDisconnectedBehavior.quiet') }}</option>
	</FormRadios>

	<FormGroup>
		<template #label>{{ $t('appearance') }}</template>
		<FormSwitch v-model:value="disableAnimatedMfm">{{ $t('disableAnimatedMfm') }}</FormSwitch>
		<FormSwitch v-model:value="reduceAnimation">{{ $t('reduceUiAnimation') }}</FormSwitch>
		<FormSwitch v-model:value="useBlurEffectForModal">{{ $t('useBlurEffectForModal') }}</FormSwitch>
		<FormSwitch v-model:value="useOsNativeEmojis">{{ $t('useOsNativeEmojis') }}
			<div><Mfm text="🍮🍦🍭🍩🍰🍫🍬🥞🍪"/></div>
		</FormSwitch>
	</FormGroup>

	<FormRadios v-model="fontSize">
		<template #desc>{{ $t('fontSize') }}</template>
		<option value="small"><span style="font-size: 14px;">Aa</span></option>
		<option :value="null"><span style="font-size: 16px;">Aa</span></option>
		<option value="large"><span style="font-size: 18px;">Aa</span></option>
		<option value="veryLarge"><span style="font-size: 20px;">Aa</span></option>
	</FormRadios>
	<FormRadios v-model="instanceTicker">
		<template #desc>{{ $t('instanceTicker') }}</template>
		<option value="none">{{ $t('_instanceTicker.none') }}</option>
		<option value="remote">{{ $t('_instanceTicker.remote') }}</option>
		<option value="always">{{ $t('_instanceTicker.always') }}</option>
	</FormRadios>

	<FormGroup>
		<template #label>{{ $t('defaultNavigationBehaviour') }}</template>
		<FormSwitch v-model:value="defaultSideView">{{ $t('openInSideView') }}</FormSwitch>
	</FormGroup>

	<FormRadios v-model="chatOpenBehavior">
		<template #desc>{{ $t('chatOpenBehavior') }}</template>
		<option value="page">{{ $t('showInPage') }}</option>
		<option value="window">{{ $t('openInWindow') }}</option>
		<option value="popout">{{ $t('popout') }}</option>
	</FormRadios>

	<section class="_card _vMargin">
		<div class="_title"><Fa :icon="faColumns"/> {{ $t('deck') }}</div>
		<div class="_content">
			<div>{{ $t('defaultNavigationBehaviour') }}</div>
			<MkSwitch v-model:value="deckNavWindow">{{ $t('openInWindow') }}</MkSwitch>
		</div>
		<div class="_content">
			<MkSwitch v-model:value="deckAlwaysShowMainColumn">
				{{ $t('_deck.alwaysShowMainColumn') }}
			</MkSwitch>
		</div>
		<div class="_content">
			<div>{{ $t('_deck.columnAlign') }}</div>
			<MkRadio v-model="deckColumnAlign" value="left">{{ $t('left') }}</MkRadio>
			<MkRadio v-model="deckColumnAlign" value="center">{{ $t('center') }}</MkRadio>
		</div>
	</section>

	<MkButton @click="cacheClear()" primary style="margin: var(--margin) auto;">{{ $t('cacheClear') }}</MkButton>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faImage, faCog, faColumns, faCogs } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkSwitch from '@/components/ui/switch.vue';
import MkSelect from '@/components/ui/select.vue';
import MkRadio from '@/components/ui/radio.vue';
import MkRadios from '@/components/ui/radios.vue';
import MkRange from '@/components/ui/range.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormRadios from '@/components/form/radios.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import { langs } from '@/config';
import { clientDb, set } from '@/db';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton,
		MkSwitch,
		MkSelect,
		MkRadio,
		MkRadios,
		MkRange,
		FormSwitch,
		FormSelect,
		FormRadios,
		FormBase,
		FormGroup,
	},

	emits: ['info'],

	data() {
		return {
			INFO: {
				title: this.$t('general'),
				icon: faCogs
			},
			langs,
			lang: localStorage.getItem('lang'),
			fontSize: localStorage.getItem('fontSize'),
			faImage, faCog, faColumns
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

		defaultSideView: {
			get() { return this.$store.state.device.defaultSideView; },
			set(value) { this.$store.commit('device/set', { key: 'defaultSideView', value }); }
		},

		deckNavWindow: {
			get() { return this.$store.state.device.deckNavWindow; },
			set(value) { this.$store.commit('device/set', { key: 'deckNavWindow', value }); }
		},

		chatOpenBehavior: {
			get() { return this.$store.state.device.chatOpenBehavior; },
			set(value) { this.$store.commit('device/set', { key: 'chatOpenBehavior', value }); }
		},

		instanceTicker: {
			get() { return this.$store.state.device.instanceTicker; },
			set(value) { this.$store.commit('device/set', { key: 'instanceTicker', value }); }
		},

		enableInfiniteScroll: {
			get() { return this.$store.state.device.enableInfiniteScroll; },
			set(value) { this.$store.commit('device/set', { key: 'enableInfiniteScroll', value }); }
		},

		deckAlwaysShowMainColumn: {
			get() { return this.$store.state.device.deckAlwaysShowMainColumn; },
			set(value) { this.$store.commit('device/set', { key: 'deckAlwaysShowMainColumn', value }); }
		},

		deckColumnAlign: {
			get() { return this.$store.state.device.deckColumnAlign; },
			set(value) { this.$store.commit('device/set', { key: 'deckColumnAlign', value }); }
		},
	},

	watch: {
		lang() {
			localStorage.setItem('lang', this.lang);

			return set('_version_', `changeLang-${(new Date()).toJSON()}`, clientDb.i18n)
				.then(() => location.reload())
				.catch(() => {
					os.dialog({
						type: 'error',
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

		enableInfiniteScroll() {
			location.reload()
		},
	},

	mounted() {
		this.$emit('info', this.INFO);
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
