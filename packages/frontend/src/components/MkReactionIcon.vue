<template>
<MkEmoji :emoji="reaction" :is-reaction="true" :normal="true" :no-style="noStyle"/>
</template>

<script lang="ts" setup>
import { } from 'vue';

const props = defineProps<{
	reaction: string;
	noStyle?: boolean;
}>();
</script>
