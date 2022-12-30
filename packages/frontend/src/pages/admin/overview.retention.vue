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
