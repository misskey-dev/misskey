<template>
<div class="xubzgfga">
	<header>{{ image.name }}</header>
	<img :src="image.url" :alt="image.name" :title="image.name" @click="close"/>
	<footer>{{ image.type }}, {{ bytes(image.size) }}</footer>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@/os';
import bytes from '@/filters/bytes';

export default defineComponent({
	props: {
		image: {
			type: Object,
			required: true
		},
	},

	methods: {
		close() {
			this.$emit('done');
		},

		bytes,
	}
});
</script>

<style lang="scss" scoped>
.xubzgfga {
	max-width: 1024px;

	> header {
		margin-bottom: 8px;
	}

	> img {
		display: block;
		max-width: 100%;
		cursor: zoom-out;
		image-orientation: from-image;
	}

	> footer {
		margin-top: 8px;
		opacity: 0.7;
	}
}
</style>
