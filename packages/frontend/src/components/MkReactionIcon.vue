<template>
<MkCustomEmoji v-if="reaction[0] === ':'" :name="reaction" :normal="true" :no-style="noStyle" :url="emojiUrl"/>
<MkEmoji v-else :emoji="reaction" :normal="true" :no-style="noStyle"/>
</template>

<script lang="ts" setup>
import { } from 'vue';

const props = defineProps<{
	reaction: string;
	noStyle?: boolean;
	emojiUrl?: string;
}>();
</script>
