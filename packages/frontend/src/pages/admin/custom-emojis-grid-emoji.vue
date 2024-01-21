<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="root">
	<img class="thumbnail" :src="emojiUrl" :alt="emojiName"/>
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

</script>

<style lang="scss">
.root {
	display: flex;
	align-items: center;
}

.thumbnail {
	object-fit: cover;
	width: 26px;
	height: auto;
	max-width: 100%;
	max-height: 100%;
}
</style>
