<template>
<svg class="mbcofsoe" viewBox="0 0 10 10" preserveAspectRatio="none">
	<circle v-for="(angle, i) in graduations"
					:cx="5 + (Math.sin(angle) * (5 - graduationsPadding))"
					:cy="5 - (Math.cos(angle) * (5 - graduationsPadding))"
					:r="i % 5 == 0 ? 0.125 : 0.05"
					:fill="i % 5 == 0 ? majorGraduationColor : minorGraduationColor"
					:key="i"
	/>

	<line
		:x1="5 - (Math.sin(sAngle) * (sHandLengthRatio * handsTailLength))"
		:y1="5 + (Math.cos(sAngle) * (sHandLengthRatio * handsTailLength))"
		:x2="5 + (Math.sin(sAngle) * ((sHandLengthRatio * 5) - handsPadding))"
		:y2="5 - (Math.cos(sAngle) * ((sHandLengthRatio * 5) - handsPadding))"
		:stroke="sHandColor"
		:stroke-width="thickness / 2"
		stroke-linecap="round"
	/>

	<line
		:x1="5 - (Math.sin(mAngle) * (mHandLengthRatio * handsTailLength))"
		:y1="5 + (Math.cos(mAngle) * (mHandLengthRatio * handsTailLength))"
		:x2="5 + (Math.sin(mAngle) * ((mHandLengthRatio * 5) - handsPadding))"
		:y2="5 - (Math.cos(mAngle) * ((mHandLengthRatio * 5) - handsPadding))"
		:stroke="mHandColor"
		:stroke-width="thickness"
		stroke-linecap="round"
	/>

	<line
		:x1="5 - (Math.sin(hAngle) * (hHandLengthRatio * handsTailLength))"
		:y1="5 + (Math.cos(hAngle) * (hHandLengthRatio * handsTailLength))"
		:x2="5 + (Math.sin(hAngle) * ((hHandLengthRatio * 5) - handsPadding))"
		:y2="5 - (Math.cos(hAngle) * ((hHandLengthRatio * 5) - handsPadding))"
		:stroke="hHandColor"
		:stroke-width="thickness"
		stroke-linecap="round"
	/>
</svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as tinycolor from 'tinycolor2';

export default defineComponent({
	props: {
		thickness: {
			type: Number,
			default: 0.1
		}
	},

	data() {
		return {
			now: new Date(),
			enabled: true,

			graduationsPadding: 0.5,
			handsPadding: 1,
			handsTailLength: 0.7,
			hHandLengthRatio: 0.75,
			mHandLengthRatio: 1,
			sHandLengthRatio: 1,

			computedStyle: getComputedStyle(document.documentElement)
		};
	},

	computed: {
		dark(): boolean {
			return tinycolor(this.computedStyle.getPropertyValue('--bg')).isDark();
		},

		majorGraduationColor(): string {
			return this.dark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
		},
		minorGraduationColor(): string {
			return this.dark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
		},

		sHandColor(): string {
			return this.dark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)';
		},
		mHandColor(): string {
			return tinycolor(this.computedStyle.getPropertyValue('--fg')).toHexString();
		},
		hHandColor(): string {
			return tinycolor(this.computedStyle.getPropertyValue('--accent')).toHexString();
		},

		s(): number {
			return this.now.getSeconds();
		},
		m(): number {
			return this.now.getMinutes();
		},
		h(): number {
			return this.now.getHours();
		},

		hAngle(): number {
			return Math.PI * (this.h % 12 + (this.m + this.s / 60) / 60) / 6;
		},
		mAngle(): number {
			return Math.PI * (this.m + this.s / 60) / 30;
		},
		sAngle(): number {
			return Math.PI * this.s / 30;
		},

		graduations(): any {
			const angles = [];
			for (let i = 0; i < 60; i++) {
				const angle = Math.PI * i / 30;
				angles.push(angle);
			}

			return angles;
		}
	},

	mounted() {
		const update = () => {
			if (this.enabled) {
				this.tick();
				setTimeout(update, 1000);
			}
		};
		update();
	},

	beforeUnmount() {
		this.enabled = false;
	},

	methods: {
		tick() {
			this.now = new Date();
		}
	}
});
</script>

<style lang="scss" scoped>
.mbcofsoe {
	display: block;
}
</style>
