<template>
<div :class="$style.root">
	<img :src="emojiUrl" :alt="emojiName"/>
</div>
</template>

<script setup lang="ts">

import { CellClassParams } from 'ag-grid-community';
import { computed } from 'vue';
import { GridItem } from '@/pages/admin/custom-emojis-grid.impl.js';

const props = defineProps<{
	params: CellClassParams<GridItem, string>
}>();

const emojiUrl = computed(() => props.params.data?.url);
const emojiName = computed(() => props.params.data?.name);

console.log({ url: emojiUrl.value, name: emojiName.value });

</script>

<style lang="scss" module>
.root {
	display: inline-flex;
	align-items: stretch;
}
</style>
