<template>
<router-view id="app" v-hotkey.global="keymap"></router-view>
</template>

<script lang="ts">
import Vue from 'vue';
import { url, lang } from './config';
import applyTheme from './common/scripts/theme';
import darkTheme from '../theme/dark.json';

export default Vue.extend({
	computed: {
		keymap(): any {
			return {
				'h|slash': this.help,
				'd': this.dark
			};
		}
	},

	methods: {
		help() {
			window.open(`${url}/docs/${lang}/keyboard-shortcut`, '_blank');
		},

		dark() {
			applyTheme(darkTheme);
		}
	}
});
</script>
