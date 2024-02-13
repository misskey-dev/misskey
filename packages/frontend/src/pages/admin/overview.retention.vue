<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_panel" :class="$style.root">
	<MkRetentionHeatmap/>
</div>
</template>

<script lang="ts" setup>
import MkRetentionHeatmap from '@/components/MkRetentionHeatmap.vue';
</script>

<style lang="scss" module>
.root {
	padding: 20px;
}
</style>
