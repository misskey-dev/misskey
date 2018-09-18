<template>
<router-view id="app" v-hotkey.global="keymap"></router-view>
</template>

<script lang="ts">
import Vue from 'vue';
import { url, lang } from './config';

export default Vue.extend({
	computed: {
		keymap(): any {
			return {
				'h|slash': this.help
			};
		}
	},

	methods: {
		help() {
			window.open(`${url}/docs/${lang}/keyboard-shortcut`, '_blank');
		}
	}
});
</script>
