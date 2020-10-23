<template>
<MkEmoji :emoji="reaction.startsWith(':') ? null : reaction" :name="reaction.startsWith(':') ? reaction.substr(1, reaction.length - 2) : null" :customEmojis="customEmojis" :is-reaction="true" :normal="true" :no-style="noStyle"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';import * as os from '@/os';

export default defineComponent({
	props: {
		reaction: {
			type: String,
			required: true
		},
		customEmojis: {
			required: false,
			default: () => []
		},
		noStyle: {
			type: Boolean,
			required: false,
			default: false
		},
	},
});
</script>
