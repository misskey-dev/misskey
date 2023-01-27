<template>
<MkModal ref="modal" :z-priority="'middle'" @click="modal.close()" @closed="emit('closed')">
	<div class="xubzgfga">
		<header>{{ image.name }}</header>
		<img :src="image.url" :alt="image.comment" :title="image.comment" @click="modal.close()"/>
		<footer>
			<span>{{ image.type }}</span>
			<span>{{ bytes(image.size) }}</span>
			<span v-if="image.properties && image.properties.width">{{ number(image.properties.width) }}px × {{ number(image.properties.height) }}px</span>
		</footer>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as misskey from 'misskey-js';
import bytes from '@/filters/bytes';
import number from '@/filters/number';
import MkModal from '@/components/MkModal.vue';

const props = withDefaults(defineProps<{
	image: misskey.entities.DriveFile;
}>(), {
});

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const modal = $shallowRef<InstanceType<typeof MkModal>>();
</script>

<style lang="scss" scoped>
.xubzgfga {
	margin: auto;
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
