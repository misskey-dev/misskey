<template>
<div class="xubzgfgb" :class="{ cover }" :title="title">
	<canvas v-if="!loaded" ref="canvas" :width="size" :height="size" :title="title"/>
	<img v-if="src" :src="src" :title="title" :alt="alt" @load="onLoad"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { decode } from 'blurhash';

export default defineComponent({
	props: {
		src: {
			type: String,
			required: false,
			default: null
		},
		hash: {
			type: String,
			required: true
		},
		alt: {
			type: String,
			required: false,
			default: '',
		},
		title: {
			type: String,
			required: false,
			default: null,
		},
		size: {
			type: Number,
			required: false,
			default: 64
		},
		cover: {
			type: Boolean,
			required: false,
			default: true,
		}
	},

	data() {
		return {
			loaded: false,
		};
	},

	mounted() {
		this.draw();
	},

	methods: {
		draw() {
			if (this.hash == null) return;
			const pixels = decode(this.hash, this.size, this.size);
			const ctx = (this.$refs.canvas as HTMLCanvasElement).getContext('2d');
			const imageData = ctx!.createImageData(this.size, this.size);
			imageData.data.set(pixels);
			ctx!.putImageData(imageData, 0, 0);
		},

		onLoad() {
			this.loaded = true;
		}
	}
});
</script>

<style lang="scss" scoped>
.xubzgfgb {
	position: relative;
	width: 100%;
	height: 100%;

	> canvas,
	> img {
		display: block;
		width: 100%;
		height: 100%;
	}

	> canvas {
		position: absolute;
		object-fit: cover;
	}

	> img {
		object-fit: contain;
	}

	&.cover {
		> img {
			object-fit: cover;
		}
	}
}
</style>
