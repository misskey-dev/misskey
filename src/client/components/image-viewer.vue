<template>
<MkModal ref="modal" @click="$refs.modal.close()" @closed="$emit('closed')">
	<div class="xubzgfga">
		<header>{{ image.name }}</header>
		<img :src="image.url" :alt="image.comment" :title="image.comment" @click="$refs.modal.close()"/>
		<footer>
			<span>{{ image.type }}</span>
			<span>{{ bytes(image.size) }}</span>
			<span v-if="image.properties && image.properties.width">{{ number(image.properties.width) }}px × {{ number(image.properties.height) }}px</span>
		</footer>
	</div>
</MkModal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import bytes from '@client/filters/bytes';
import number from '@client/filters/number';
import MkModal from '@client/components/ui/modal.vue';

export default defineComponent({
	components: {
		MkModal,
	},

	props: {
		image: {
			type: Object,
			required: true
		},
	},

	emits: ['closed'],

	methods: {
		bytes,
		number,
	}
});
</script>

<style lang="scss" scoped>
.xubzgfga {
	display: flex;
	flex-direction: column;
	height: 100%;

	> header,
	> footer {
		align-self: center;
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
		flex: 1;
		min-height: 0;
		object-fit: contain;
		width: 100%;
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
