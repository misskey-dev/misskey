<template>
<Mfm :text="user.name || user.username" :plain="true" :nowrap="nowrap" :custom-emojis="user.emojis"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@/os';

export default defineComponent({
	props: {
		user: {
			type: Object,
			required: true
		},
		nowrap: {
			type: Boolean,
			default: true
		},
	}
});
</script>
