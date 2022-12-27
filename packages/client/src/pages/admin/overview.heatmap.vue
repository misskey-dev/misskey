<template>
<div class="_panel" :class="$style.root">
	<MkActiveUsersHeatmap/>
</div>
</template>

<script lang="ts" setup>
import MkActiveUsersHeatmap from '@/components/MkActiveUsersHeatmap.vue';
</script>

<style lang="scss" module>
.root {
	padding: 20px;
}
</style>
