<template>
<svg class="mk-analog-clock" viewBox="0 0 10 10" preserveAspectRatio="none">
	<line v-for="angle, i in graduations"
		:x1="5 + (Math.sin(angle) * (5 - graduationsPadding))"
		:y1="5 - (Math.cos(angle) * (5 - graduationsPadding))"
		:x2="5 + (Math.sin(angle) * ((5 - graduationsPadding) - (i % 5 == 0 ? longGraduationLength : shortGraduationLength)))"
		:y2="5 - (Math.cos(angle) * ((5 - graduationsPadding) - (i % 5 == 0 ? longGraduationLength : shortGraduationLength)))"
		:stroke="i % 5 == 0 ? longGraduationColor : shortGraduationColor"
		stroke-width="0.05"/>

	<line
		x1="5"
		y1="5"
		:x2="5 + (Math.sin(sAngle) * ((sHandLengthRatio * 5) - handsPadding))"
		:y2="5 - (Math.cos(sAngle) * ((sHandLengthRatio * 5) - handsPadding))"
		:stroke="sHandColor"
		stroke-width="0.05"/>
	<line
		x1="5"
		y1="5"
		:x2="5 + (Math.sin(mAngle) * ((mHandLengthRatio * 5) - handsPadding))"
		:y2="5 - (Math.cos(mAngle) * ((mHandLengthRatio * 5) - handsPadding))"
		:stroke="mHandColor"
		stroke-width="0.1"/>
	<line
		x1="5"
		y1="5"
		:x2="5 + (Math.sin(hAngle) * ((hHandLengthRatio * 5) - handsPadding))"
		:y2="5 - (Math.cos(hAngle) * ((hHandLengthRatio * 5) - handsPadding))"
		:stroke="hHandColor"
		stroke-width="0.1"/>
</svg>
</template>

<script lang="ts">
import Vue from 'vue';
import { themeColor } from '../../../config';

export default Vue.extend({
	data() {
		return {
			now: new Date(),
			clock: null,

			graduationsPadding: 0.5,
			longGraduationLength: 0.3,
			shortGraduationLength: 0.15,
			handsPadding: 1,
			hHandLengthRatio: 0.75,
			mHandLengthRatio: 1,
			sHandLengthRatio: 1,
		};
	},
	computed: {
		longGraduationColor(): string {
			return 'rgba(255, 255, 255, 0.3)';
		},
		shortGraduationColor(): string {
			return 'rgba(255, 255, 255, 0.2)';
		},
		sHandColor(): string {
			return 'rgba(255, 255, 255, 0.5)';
		},
		mHandColor(): string {
			return '#fff';
		},
		hHandColor(): string {
			return themeColor;
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
			return Math.PI * (this.h % 12 + this.m / 60) / 6;
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
		this.clock = setInterval(this.tick, 1000);
	},
	beforeDestroy() {
		clearInterval(this.clock);
	},
	methods: {
		tick() {
			this.now = new Date();
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-analog-clock
	display block
	width 256px
	height 256px
</style>
