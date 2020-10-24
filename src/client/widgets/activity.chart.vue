<template>
<svg :viewBox="`0 0 ${ viewBoxX } ${ viewBoxY }`" @mousedown.prevent="onMousedown">
	<polyline
		:points="pointsNote"
		fill="none"
		stroke-width="1"
		stroke="#41ddde"/>
	<polyline
		:points="pointsReply"
		fill="none"
		stroke-width="1"
		stroke="#f7796c"/>
	<polyline
		:points="pointsRenote"
		fill="none"
		stroke-width="1"
		stroke="#a1de41"/>
	<polyline
		:points="pointsTotal"
		fill="none"
		stroke-width="1"
		stroke="#555"
		stroke-dasharray="2 2"/>
</svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@/os';

function dragListen(fn) {
	window.addEventListener('mousemove',  fn);
	window.addEventListener('mouseleave', dragClear.bind(null, fn));
	window.addEventListener('mouseup',    dragClear.bind(null, fn));
}

function dragClear(fn) {
	window.removeEventListener('mousemove',  fn);
	window.removeEventListener('mouseleave', dragClear);
	window.removeEventListener('mouseup',    dragClear);
}

export default defineComponent({
	props: ['data'],
	data() {
		return {
			viewBoxX: 147,
			viewBoxY: 60,
			zoom: 1,
			pos: 0,
			pointsNote: null,
			pointsReply: null,
			pointsRenote: null,
			pointsTotal: null
		};
	},
	created() {
		for (const d of this.data) {
			d.total = d.notes + d.replies + d.renotes;
		}

		this.render();
	},
	methods: {
		render() {
			const peak = Math.max.apply(null, this.data.map(d => d.total));
			if (peak != 0) {
				const data = this.data.slice().reverse();
				this.pointsNote = data.map((d, i) => `${(i * this.zoom) + this.pos},${(1 - (d.notes / peak)) * this.viewBoxY}`).join(' ');
				this.pointsReply = data.map((d, i) => `${(i * this.zoom) + this.pos},${(1 - (d.replies / peak)) * this.viewBoxY}`).join(' ');
				this.pointsRenote = data.map((d, i) => `${(i * this.zoom) + this.pos},${(1 - (d.renotes / peak)) * this.viewBoxY}`).join(' ');
				this.pointsTotal = data.map((d, i) => `${(i * this.zoom) + this.pos},${(1 - (d.total / peak)) * this.viewBoxY}`).join(' ');
			}
		},
		onMousedown(e) {
			const clickX = e.clientX;
			const clickY = e.clientY;
			const baseZoom = this.zoom;
			const basePos = this.pos;

			// 動かした時
			dragListen(me => {
				let moveLeft = me.clientX - clickX;
				let moveTop = me.clientY - clickY;

				this.zoom = baseZoom + (-moveTop / 20);
				this.pos = basePos + moveLeft;
				if (this.zoom < 1) this.zoom = 1;
				if (this.pos > 0) this.pos = 0;
				if (this.pos < -(((this.data.length - 1) * this.zoom) - this.viewBoxX)) this.pos = -(((this.data.length - 1) * this.zoom) - this.viewBoxX);

				this.render();
			});
		}
	}
});
</script>

<style lang="scss" scoped>
svg {
	display: block;
	padding: 16px;
	width: 100%;
	box-sizing: border-box;
	cursor: all-scroll;
}
</style>
