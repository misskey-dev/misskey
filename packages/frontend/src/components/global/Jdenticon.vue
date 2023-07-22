<template>
	<div>
		<canvas ref="canvas" :class="$style.icon" width="128" height="128" />
	</div>
</template>

<script lang="ts" setup>
import { onMounted, shallowRef, watch } from 'vue';
import * as jdenticon from 'jdenticon';

const config = {
	lightness: {
		color: [0.54, 0.85],
		grayscale: [0.52, 0.90]
	},
	saturation: {
		color: 0.63,
		grayscale: 0.39
	},
	backColor: "#fff"
};

const props = withDefaults(defineProps<{
	acct: string
}>(), {
	acct: ""
});

const canvas = shallowRef<HTMLCanvasElement>();

onMounted(() => {
	if (import.meta.env.MODE === 'test') {
		canvas.value = document.createElement('canvas');
		canvas.value.width = 128;
		canvas.value.height = 128;
		return;
	}

	if (canvas.value instanceof HTMLCanvasElement) {
		const ctx = canvas.value.getContext('2d');
		if (!ctx) return;

		jdenticon.drawIcon(ctx, props.acct, 128, config);
	}
});

watch(() => props.acct, () => {
	if (typeof canvas.value !== 'undefined') jdenticon.updateCanvas(canvas.value, props.acct, config);
}, {
	immediate: true,
});

</script>

<style lang="scss" module>

.icon {
	width: 100%;
	height: 100%;
}

</style>
