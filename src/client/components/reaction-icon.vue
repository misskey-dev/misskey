<template>
<mk-emoji :emoji="reaction.startsWith(':') ? null : reaction" :name="reaction.startsWith(':') ? reaction.substr(1, reaction.length - 2) : null" :is-reaction="true" :custom-emojis="customEmojis" :normal="true" :no-style="noStyle"/>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../i18n';
export default Vue.extend({
	i18n,
	props: {
		reaction: {
			type: String,
			required: true
		},
		noStyle: {
			type: Boolean,
			required: false,
			default: false
		},
	},
	data() {
		return {
			customEmojis: []
		};
	},
	created() {
		this.$root.getMeta().then(meta => {
			if (meta && meta.emojis) this.customEmojis = meta.emojis;
		});
	},
});
</script>
