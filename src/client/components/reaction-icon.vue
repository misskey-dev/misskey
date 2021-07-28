<template>
<MkEmoji :emoji="reaction" :custom-emojis="customEmojis" :is-reaction="true" :normal="true" :no-style="noStyle"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

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
