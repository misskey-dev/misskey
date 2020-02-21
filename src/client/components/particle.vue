<template>
<div class="vswabwbm" :style="{ top: `${y - 64}px`, left: `${x - 64}px` }" :class="{ active }">
	<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
		<circle fill="none" cx="64" cy="64">
			<animate attributeName="r"
					begin="0s" dur="0.5s"
					values="4; 32"
					calcMode="spline"
					keyTimes="0; 1"
					keySplines="0.165, 0.84, 0.44, 1"
					repeatCount="1" />
			<animate attributeName="stroke-width"
					begin="0s" dur="0.5s"
					values="16; 0"
					calcMode="spline"
					keyTimes="0; 1"
					keySplines="0.3, 0.61, 0.355, 1"
					repeatCount="1" />
		</circle>
		<g fill="none" fill-rule="evenodd">
			<circle v-for="(particle, i) in particles" :key="i" :fill="particle.color">
				<animate attributeName="r"
						begin="0s" dur="0.8s"
						:values="`${particle.size}; 0`"
						calcMode="spline"
						keyTimes="0; 1"
						keySplines="0.165, 0.84, 0.44, 1"
						repeatCount="1" />
				<animate attributeName="cx"
						begin="0s" dur="0.8s"
						:values="`${particle.xA}; ${particle.xB}`"
						calcMode="spline"
						keyTimes="0; 1"
						keySplines="0.3, 0.61, 0.355, 1"
						repeatCount="1" />
				<animate attributeName="cy"
						begin="0s" dur="0.8s"
						:values="`${particle.yA}; ${particle.yB}`"
						calcMode="spline"
						keyTimes="0; 1"
						keySplines="0.3, 0.61, 0.355, 1"
						repeatCount="1" />
			</circle>
		</g>
	</svg>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		x: {
			type: Number,
			required: true
		},
		y: {
			type: Number,
			required: true
		}
	},
	data() {
		const particles = [];
		const origin = 64;
		const colors = ['#FF1493', '#00FFFF', '#FFE202'];

		for (let i = 0; i < 12; i++) {
			const angle = Math.random() * (Math.PI * 2);
			const pos = Math.random() * 16;
			const velocity = 16 + (Math.random() * 48);
			particles.push({
				size: 4 + (Math.random() * 8),
				xA: origin + (Math.sin(angle) * pos),
				yA: origin + (Math.cos(angle) * pos),
				xB: origin + (Math.sin(angle) * (pos + velocity)),
				yB: origin + (Math.cos(angle) * (pos + velocity)),
				color: colors[Math.floor(Math.random() * colors.length)]
			});
		}

		return {
			particles
		};
	},
	mounted() {
		setTimeout(() => {
			this.destroyDom();
		}, 1100);
	}
});
</script>

<style lang="scss" scoped>
.vswabwbm {
	pointer-events: none;
	position: fixed;
	z-index: 1000000;
	width: 128px;
	height: 128px;

	> svg {
		> circle {
			stroke: var(--accent);
		}
	}
}
</style>
