<template>
<section class="_card">
	<div class="_title"><fa :icon="faCog"/> {{ $t('general') }}</div>
	<div class="_content">
		<mk-input type="file" @change="onWallpaperChange" style="margin-top: 0;">
			<span>{{ $t('wallpaper') }}</span>
			<template #icon><fa :icon="faImage"/></template>
			<template #desc v-if="wallpaperUploading">{{ $t('uploading') }}<mk-ellipsis/></template>
		</mk-input>
		<mk-button primary :disabled="$store.state.settings.wallpaper == null" @click="delWallpaper()">{{ $t('removeWallpaper') }}</mk-button>
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
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faImage, faCog } from '@fortawesome/free-solid-svg-icons';
import MkInput from '../../components/ui/input.vue';
import MkButton from '../../components/ui/button.vue';
import MkSwitch from '../../components/ui/switch.vue';
import MkSelect from '../../components/ui/select.vue';
import i18n from '../../i18n';
import { apiUrl, langs } from '../../config';

export default Vue.extend({
	i18n,

	components: {
		MkInput,
		MkButton,
		MkSwitch,
		MkSelect,
	},
	
	data() {
		return {
			langs,
			lang: localStorage.getItem('lang'),
			wallpaperUploading: false,
			faImage, faCog
		}
	},

	computed: {
		wallpaper: {
			get() { return this.$store.state.settings.wallpaper; },
			set(value) { this.$store.dispatch('settings/set', { key: 'wallpaper', value }); }
		},

		autoReload: {
			get() { return this.$store.state.device.autoReload; },
			set(value) { this.$store.commit('device/set', { key: 'autoReload', value }); }
		},

		reduceAnimation: {
			get() { return !this.$store.state.device.animation; },
			set(value) { this.$store.commit('device/set', { key: 'animation', value: !value }); }
		},

		useOsNativeEmojis: {
			get() { return this.$store.state.device.useOsNativeEmojis; },
			set(value) { this.$store.commit('device/set', { key: 'useOsNativeEmojis', value }); }
		},
	},

	watch: {
		lang() {
			localStorage.setItem('lang', this.lang);
			localStorage.removeItem('locale');
			location.reload();
		}
	},

	methods: {
		onWallpaperChange([file]) {
			this.wallpaperUploading = true;

			const data = new FormData();
			data.append('file', file);
			data.append('i', this.$store.state.i.token);

			fetch(apiUrl + '/drive/files/create', {
				method: 'POST',
				body: data
			})
			.then(response => response.json())
			.then(f => {
				this.wallpaper = f.url;
				this.wallpaperUploading = false;
				document.documentElement.style.backgroundImage = `url(${this.$store.state.settings.wallpaper})`;
			})
			.catch(e => {
				this.wallpaperUploading = false;
				this.$root.dialog({
					type: 'error',
					text: e
				});
			});
		},

		delWallpaper() {
			this.wallpaper = null;
			document.documentElement.style.backgroundImage = 'none';
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
