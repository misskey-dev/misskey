<template>
<svg class="hsalcinq" viewBox="0 0 1 1" preserveAspectRatio="none">
	<circle
		:r="r"
		cx="50%" cy="50%"
		fill="none"
		stroke-width="0.1"
		stroke="rgba(0, 0, 0, 0.05)"
	/>
	<circle
		:r="r"
		cx="50%" cy="50%"
		:stroke-dasharray="Math.PI * (r * 2)"
		:stroke-dashoffset="strokeDashoffset"
		fill="none"
		stroke-width="0.1"
		:stroke="color"
	/>
	<text x="50%" y="50%" dy="0.05" text-anchor="middle">{{ (value * 100).toFixed(0) }}%</text>
</svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		value: {
			type: Number,
			required: true
		}
	},
	data() {
		return {
			r: 0.45
		};
	},
	computed: {
		color(): string {
			return `hsl(${180 - (this.value * 180)}, 80%, 70%)`;
		},
		strokeDashoffset(): number {
			return (1 - this.value) * (Math.PI * (this.r * 2));
		}
	}
});
</script>

<style lang="scss" scoped>
.hsalcinq {
	display: block;
	height: 100%;

	> circle {
		transform-origin: center;
		transform: rotate(-90deg);
		transition: stroke-dashoffset 0.5s ease;
	}

	> text {
		font-size: 0.15px;
		fill: currentColor;
	}
}
</style>
