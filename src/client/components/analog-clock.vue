<template>
<svg class="mbcofsoe" viewBox="0 0 10 10" preserveAspectRatio="none">
	<circle v-for="(angle, i) in graduations"
					:cx="5 + (Math.sin(angle) * (5 - graduationsPadding))"
					:cy="5 - (Math.cos(angle) * (5 - graduationsPadding))"
					:r="i % 5 == 0 ? 0.125 : 0.05"
					:fill="i % 5 == 0 ? majorGraduationColor : minorGraduationColor"
					:key="i"/>

	<line
		:x1="5 - (Math.sin(sAngle) * (sHandLengthRatio * handsTailLength))"
		:y1="5 + (Math.cos(sAngle) * (sHandLengthRatio * handsTailLength))"
		:x2="5 + (Math.sin(sAngle) * ((sHandLengthRatio * 5) - handsPadding))"
		:y2="5 - (Math.cos(sAngle) * ((sHandLengthRatio * 5) - handsPadding))"
		:stroke="sHandColor"
		stroke-width="0.05"/>

	<line
		:x1="5 - (Math.sin(mAngle) * (mHandLengthRatio * handsTailLength))"
		:y1="5 + (Math.cos(mAngle) * (mHandLengthRatio * handsTailLength))"
		:x2="5 + (Math.sin(mAngle) * ((mHandLengthRatio * 5) - handsPadding))"
		:y2="5 - (Math.cos(mAngle) * ((mHandLengthRatio * 5) - handsPadding))"
		:stroke="mHandColor"
		stroke-width="0.1"/>

	<line
		:x1="5 - (Math.sin(hAngle) * (hHandLengthRatio * handsTailLength))"
		:y1="5 + (Math.cos(hAngle) * (hHandLengthRatio * handsTailLength))"
		:x2="5 + (Math.sin(hAngle) * ((hHandLengthRatio * 5) - handsPadding))"
		:y2="5 - (Math.cos(hAngle) * ((hHandLengthRatio * 5) - handsPadding))"
		:stroke="hHandColor"
		stroke-width="0.1"/>
</svg>
</template>

<script lang="ts">
import Vue from 'vue';
import * as tinycolor from 'tinycolor2';

export default Vue.extend({
	props: {
		smooth: {
			type: Boolean,
			default: false
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

		ms(): number {
			return this.now.getMilliseconds() * (this.smooth ? 1 : 0);
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
			return Math.PI * (this.h % 12 + (this.m + (this.s + this.ms / 1000) / 60) / 60) / 6;
		},
		mAngle(): number {
			return Math.PI * (this.m + (this.s + this.ms / 1000) / 60) / 30;
		},
		sAngle(): number {
			return Math.PI * (this.s + this.ms / 1000) / 30;
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
				requestAnimationFrame(update);
			}
		};
		update();

		this.$store.subscribe((mutation, state) => {
			if (mutation.type !== 'device/set') return;

			if (mutation?.payload?.key !== 'theme') return;

			this.computedStyle = getComputedStyle(document.documentElement);
		});
	},

	beforeDestroy() {
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
