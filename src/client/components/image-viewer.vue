<template>
<div class="xubzgfga">
	<header>{{ image.name }}</header>
	<img :src="image.url" :alt="image.name" :title="image.name" @click="close"/>
	<footer>
		<span>{{ image.type }}</span>
		<span>{{ bytes(image.size) }}</span>
		<span v-if="image.properties?.width">{{ number(image.properties.width) }}px × {{ number(image.properties.height) }}px</span>
	</footer>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import bytes from '@/filters/bytes';
import number from '@/filters/number';

export default defineComponent({
	props: {
		image: {
			type: Object,
			required: true
		},
	},

	emits: ['done'],

	methods: {
		close() {
			this.$emit('done');
		},

		bytes,
		number,
	}
});
</script>

<style lang="scss" scoped>
.xubzgfga {
	max-width: 1024px;

	> header,
	> footer {
		display: inline-block;
		padding: 6px 9px;
		font-size: 90%;
		background: rgba(0, 0, 0, 0.5);
		border-radius: 6px;
		color: #fff;
	}

	> header {
		margin-bottom: 8px;
		opacity: 0.9;
	}

	> img {
		display: block;
		max-width: 100%;
		cursor: zoom-out;
		image-orientation: from-image;
	}

	> footer {
		margin-top: 8px;
		opacity: 0.8;

		> span + span {
			margin-left: 0.5em;
			padding-left: 0.5em;
			border-left: solid 1px rgba(255, 255, 255, 0.5);
		}
	}
}
</style>
