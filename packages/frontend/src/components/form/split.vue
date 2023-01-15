<template>
<div :class="$style.root">
	<slot></slot>
</div>
</template>

<script lang="ts" setup>
import { provide } from 'vue';

const props = withDefaults(defineProps<{
	minWidth?: number;
}>(), {
	minWidth: 210,
});

provide('splited', true);

const minWidth = props.minWidth + 'px';
</script>

<style lang="scss" module>
.root {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(v-bind('minWidth'), 1fr));
	grid-gap: 12px;
}
</style>
