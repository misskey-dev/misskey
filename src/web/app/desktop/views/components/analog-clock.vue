<template>
<canvas class="mk-analog-clock" ref="canvas" width="256" height="256"></canvas>
</template>

<script lang="ts">
import Vue from 'vue';
import { themeColor } from '../../../config';

const Vec2 = function(this: any, x, y) {
	this.x = x;
	this.y = y;
};

export default Vue.extend({
	data() {
		return {
			clock: null
		};
	},
	mounted() {
		this.tick();
		this.clock = setInterval(this.tick, 1000);
	},
	beforeDestroy() {
		clearInterval(this.clock);
	},
	methods: {
		tick() {
			const canv = this.$refs.canvas as any;

			const now = new Date();
			const s = now.getSeconds();
			const m = now.getMinutes();
			const h = now.getHours();

			const ctx = canv.getContext('2d');
			const canvW = canv.width;
			const canvH = canv.height;
			ctx.clearRect(0, 0, canvW, canvH);

			{ // 背景
				const center = Math.min((canvW / 2), (canvH / 2));
				const lineStart =    center * 0.90;
				const shortLineEnd = center * 0.87;
				const longLineEnd =  center * 0.84;
				for (let i = 0; i < 60; i++) {
					const angle = Math.PI * i / 30;
					const uv = new Vec2(Math.sin(angle), -Math.cos(angle));
					ctx.beginPath();
					ctx.lineWidth = 1;
					ctx.moveTo((canvW / 2) + uv.x * lineStart, (canvH / 2) + uv.y * lineStart);
					if (i % 5 == 0) {
						ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
						ctx.lineTo((canvW / 2) + uv.x * longLineEnd, (canvH / 2) + uv.y * longLineEnd);
					} else {
						ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
						ctx.lineTo((canvW / 2) + uv.x * shortLineEnd, (canvH / 2) + uv.y * shortLineEnd);
					}
					ctx.stroke();
				}
			}

			{ // 分
				const angle = Math.PI * (m + s / 60) / 30;
				const length = Math.min(canvW, canvH) / 2.6;
				const uv = new Vec2(Math.sin(angle), -Math.cos(angle));
				ctx.beginPath();
				ctx.strokeStyle = '#ffffff';
				ctx.lineWidth = 2;
				ctx.moveTo(canvW / 2 - uv.x * length / 5, canvH / 2 - uv.y * length / 5);
				ctx.lineTo(canvW / 2 + uv.x * length,     canvH / 2 + uv.y * length);
				ctx.stroke();
			}

			{ // 時
				const angle = Math.PI * (h % 12 + m / 60) / 6;
				const length = Math.min(canvW, canvH) / 4;
				const uv = new Vec2(Math.sin(angle), -Math.cos(angle));
				ctx.beginPath();
				ctx.strokeStyle = themeColor;
				ctx.lineWidth = 2;
				ctx.moveTo(canvW / 2 - uv.x * length / 5, canvH / 2 - uv.y * length / 5);
				ctx.lineTo(canvW / 2 + uv.x * length,     canvH / 2 + uv.y * length);
				ctx.stroke();
			}

			{ // 秒
				const angle = Math.PI * s / 30;
				const length = Math.min(canvW, canvH) / 2.6;
				const uv = new Vec2(Math.sin(angle), -Math.cos(angle));
				ctx.beginPath();
				ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
				ctx.lineWidth = 1;
				ctx.moveTo(canvW / 2 - uv.x * length / 5, canvH / 2 - uv.y * length / 5);
				ctx.lineTo(canvW / 2 + uv.x * length,     canvH / 2 + uv.y * length);
				ctx.stroke();
			}
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
