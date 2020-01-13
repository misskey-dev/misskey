<template>
<section class="mk-settings-page-general _section">
	<div class="_title"><fa :icon="faCog"/> {{ $t('general') }}</div>
	<div class="_content">
		<x-input type="file" @change="onWallpaperChange" style="margin-top: 0;">
			<span>{{ $t('wallpaper') }}</span>
			<template #icon><fa :icon="faImage"/></template>
			<template #desc v-if="wallpaperUploading">{{ $t('uploading') }}<mk-ellipsis/></template>
		</x-input>
		<x-button primary :disabled="$store.state.settings.wallpaper == null" @click="del()">{{ $t('removeWallpaper') }}</x-button>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faImage, faCog } from '@fortawesome/free-solid-svg-icons';
import XInput from '../components/ui/input.vue';
import XButton from '../components/ui/button.vue';
import i18n from '../i18n';
import { apiUrl } from '../config';

export default Vue.extend({
	i18n,

	components: {
		XInput,
		XButton,
	},
	
	data() {
		return {
			wallpaperUploading: false,
			faImage, faCog
		}
	},

	computed: {
		wallpaper: {
			get() { return this.$store.state.settings.wallpaper; },
			set(value) { this.$store.dispatch('settings/set', { key: 'wallpaper', value }); }
		},
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

		del() {
			this.wallpaper = null;
			document.documentElement.style.backgroundImage = 'none';
		}
	}
});
</script>
