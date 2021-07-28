<template>
<div class="mk-app" :class="{ wallpaper }" @contextmenu.prevent="() => {}">
	<XSidebar ref="nav" class="sidebar"/>

	<XCommon/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { host } from '@client/config';
import { search } from '@client/scripts/search';
import XCommon from './_common_/common.vue';
import * as os from '@client/os';
import XSidebar from '@client/ui/_common_/sidebar.vue';
import { menuDef } from '@client/menu';
import { ColdDeviceStorage } from '@client/store';

export default defineComponent({
	components: {
		XCommon,
		XSidebar
	},

	provide() {
		return {
			navHook: (url) => {
				os.pageWindow(url);
			}
		};
	},

	data() {
		return {
			host: host,
			menuDef: menuDef,
			wallpaper: localStorage.getItem('wallpaper') != null,
		};
	},

	computed: {
		menu(): string[] {
			return this.$store.state.menu;
		},
	},

	created() {
		if (window.innerWidth < 1024) {
			localStorage.setItem('ui', 'default');
			location.reload();
		}
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
	height: 100vh;
	width: 100vw;
}
</style>

<style lang="scss">
</style>
