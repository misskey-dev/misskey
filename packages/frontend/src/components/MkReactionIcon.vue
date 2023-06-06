<template>
<MkCustomEmoji v-if="reaction[0] === ':'" :name="reaction" :normal="true" :noStyle="noStyle" :url="emojiUrl"/>
<MkEmoji v-else :emoji="reaction" :normal="true" :noStyle="noStyle"/>
</template>

<script lang="ts" setup>
import { } from 'vue';

const props = defineProps<{
	reaction: string;
	noStyle?: boolean;
	emojiUrl?: string;
}>();
</script>
