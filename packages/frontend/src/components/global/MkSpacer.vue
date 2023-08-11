<template>
<div :class="[$style.root, { [$style.rootMin]: forceSpacerMin }]">
	<div :class="$style.content">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts" setup>
import { inject } from 'vue';
import { deviceKind } from '@/scripts/device-kind';

const props = withDefaults(defineProps<{
	contentMax?: number | null;
	marginMin?: number;
	marginMax?: number;
}>(), {
	contentMax: null,
	marginMin: 12,
	marginMax: 24,
});

const forceSpacerMin = inject('forceSpacerMin', false) || deviceKind === 'smartphone';
</script>

<style lang="scss" module>
.root {
	box-sizing: border-box;
	width: 100%;
}
.rootMin {
	padding: v-bind('props.marginMin + "px"') !important;
}

.content {
	margin: 0 auto;
	max-width: v-bind('props.contentMax + "px"');
	container-type: inline-size;
}

@container (max-width: 450px) {
	.root {
		padding: v-bind('props.marginMin + "px"');
	}
}

@container (min-width: 451px) {
	.root {
		padding: v-bind('props.marginMax + "px"');
	}
}
</style>
