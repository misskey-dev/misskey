<template>
<th :class="[$style.num, [top ? {} : $style.border]]">
	{{ content }}
</th>
</template>

<script setup lang="ts">
import { GridRow } from '@/components/grid/grid.js';

defineProps<{
	content: string,
	row?: GridRow,
	top?: boolean,
}>();

</script>

<style module lang="scss">
.num {
	padding: 0 8px;
	min-width: 30px;
	width: 30px;
}

.border {
	border-top: solid 0.5px var(--divider);
}
</style>
