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
import 'viewerjs/dist/viewer.css';
import Viewer from 'viewerjs';
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
	mounted ()
	{
		const ua = navigator.userAgent.toLowerCase();
		const isiOS =  /ipod|iphone|ipad/.test(ua);
		if (!isiOS) {
			this.createViewer();
		}
	},
	destroyed (){
		this.destroyViewer();
	},
	methods: {
		bytes,
		number,
		destroyViewer () {
			this.$viewer && this.$viewer.destroy()
		},
		createViewer () {
			let title=(this.image.properties && this.image.properties.width)?`Neko.ci | 暖ロリ猫の家 |${this.image.type} | ${bytes(this.image.size)} | ${this.image.name} (${number(this.image.properties.width)}px × ${number(this.image.properties.height)}px)`:`${this.image.type} | ${bytes(this.image.size)} | ${this.image.name}`;
			let toolbar={
				zoomIn: 4,
				zoomOut: 4,
				oneToOne: 4,
				reset: 4,
				prev: 0,
				play: {
					show: 4,
					size: 'large',
				},
				next: 0,
				rotateLeft: 4,
				rotateRight: 4,
				flipHorizontal: 4,
				flipVertical: 4,};
			this.$viewer = new Viewer(this.$el, {title: [1, ()=>title],navbar:0,toolbar:toolbar,slideOnTouch:false,zIndex:99999});
			this.$viewer.show();
			this.$refs.modal.close(); //Fix the bug that one same image show twice
		}
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
