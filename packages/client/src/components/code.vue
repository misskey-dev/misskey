<template>
<XCode :code="code" :lang="lang" :inline="inline"/>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';

defineProps<{
	code: string;
	lang?: string;
	inline?: boolean;
}>();

const XCode = defineAsyncComponent(() => import('./code-core.vue'));
</script>
