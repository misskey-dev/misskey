<template>
<div class="mk-app" v-hotkey.global="keymap" :class="{ wallpaper }" @contextmenu.prevent="() => {}">
	<XSidebar ref="nav" class="sidebar"/>

	<XCommon/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { host } from '@/config';
import { search } from '@/scripts/search';
import XCommon from './_common_/common.vue';
import * as os from '@/os';
import XSidebar from '@/components/sidebar.vue';
import { sidebarDef } from '@/sidebar';

export default defineComponent({
	components: {
		XCommon,
		XSidebar
	},

	data() {
		return {
			host: host,
			menuDef: sidebarDef,
			wallpaper: localStorage.getItem('wallpaper') != null,
		};
	},

	computed: {
		keymap(): any {
			return {
				'd': () => {
					if (this.$store.state.device.syncDeviceDarkMode) return;
					this.$store.commit('device/set', { key: 'darkMode', value: !this.$store.state.device.darkMode });
				},
				'p': os.post,
				'n': os.post,
				's': () => search(),
				'h|/': this.help
			};
		},

		menu(): string[] {
			return this.$store.state.deviceUser.menu;
		},
	},


	methods: {
		help() {
			this.$router.push('/docs/keyboard-shortcut');
		},
	}
});
</script>

<style lang="scss" scoped>
.mk-app {
}
</style>

<style lang="scss">
</style>
