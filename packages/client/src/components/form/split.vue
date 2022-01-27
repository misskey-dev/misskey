<template>
<div class="terlnhxf _formBlock">
	<slot></slot>
</div>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
	minWidth: number;
}>(), {
  minWidth: 210,
});

const minWidth = props.minWidth + 'px';
</script>

<style lang="scss" scoped>
.terlnhxf {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(v-bind('minWidth'), 1fr));
	grid-gap: 12px;

	> ::v-deep(*) {
		margin: 0 !important;
	}
}
</style>
