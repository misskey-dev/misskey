<template>
<section class="_card">
	<div class="_title"><fa :icon="faCog"/> {{ $t('general') }}</div>
	<div class="_content">
		<mk-button primary v-if="wallpaper == null" @click="setWallpaper">{{ $t('setWallpaper') }}</mk-button>
		<mk-button primary v-else @click="wallpaper = null">{{ $t('removeWallpaper') }}</mk-button>
	</div>
	<div class="_content">
		<mk-switch v-model="autoReload">
			{{ $t('autoReloadWhenDisconnected') }}
		</mk-switch>
		<mk-switch v-model="$store.state.i.autoWatch" @change="onChangeAutoWatch">
			{{ $t('autoNoteWatch') }}<template #desc>{{ $t('autoNoteWatchDescription') }}</template>
		</mk-switch>
	</div>
	<div class="_content">
		<mk-button @click="readAllNotifications">{{ $t('markAsReadAllNotifications') }}</mk-button>
		<mk-button @click="readAllUnreadNotes">{{ $t('markAsReadAllUnreadNotes') }}</mk-button>
		<mk-button @click="readAllMessagingMessages">{{ $t('markAsReadAllTalkMessages') }}</mk-button>
	</div>
	<div class="_content">
		<mk-switch v-model="imageNewTab">{{ $t('openImageInNewTab') }}</mk-switch>
		<mk-switch v-model="disableAnimatedMfm">{{ $t('disableAnimatedMfm') }}</mk-switch>
		<mk-switch v-model="reduceAnimation">{{ $t('reduceUiAnimation') }}</mk-switch>
		<mk-switch v-model="useOsNativeEmojis">
			{{ $t('useOsNativeEmojis') }}
			<template #desc><mfm text="🍮🍦🍭🍩🍰🍫🍬🥞🍪"/></template>
		</mk-switch>
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
</template>

<script lang="ts">
import Vue from 'vue';
import { faImage, faCog } from '@fortawesome/free-solid-svg-icons';
import MkInput from '../../components/ui/input.vue';
import MkButton from '../../components/ui/button.vue';
import MkSwitch from '../../components/ui/switch.vue';
import MkSelect from '../../components/ui/select.vue';
import MkRadio from '../../components/ui/radio.vue';
import i18n from '../../i18n';
import { langs } from '../../config';
import { selectFile } from '../../scripts/select-file';

export default Vue.extend({
	i18n,

	components: {
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
			wallpaper: localStorage.getItem('wallpaper'),
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

		wallpaper() {
			if (this.wallpaper == null) {
				localStorage.removeItem('wallpaper');
			} else {
				localStorage.setItem('wallpaper', this.wallpaper);
			}
			location.reload();
		}
	},

	methods: {
		setWallpaper(e) {
			selectFile(this, e.currentTarget || e.target, null, false).then(file => {
				this.wallpaper = file.url;
			});
		},

		onChangeAutoWatch(v) {
			this.$root.api('i/update', {
				autoWatch: v
			});
		},

		readAllUnreadNotes() {
			this.$root.api('i/read_all_unread_notes');
		},

		readAllMessagingMessages() {
			this.$root.api('i/read_all_messaging_messages');
		},

		readAllNotifications() {
			this.$root.api('notifications/mark_all_as_read');
		}
	}
});
</script>
