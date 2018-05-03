<template>
	<video class="mk-media-video"
		:src="video.url"
		:title="video.name"
		controls
		@dblclick.prevent="onClick"
		ref="video"
		v-if="inlinePlayable" />
	<a class="mk-media-video-thumbnail"
		:href="video.url"
		:style="imageStyle"
		@click.prevent="onClick"
		:title="video.name"
		v-else>
		%fa:R play-circle%
	</a>
</template>

<script lang="ts">
import Vue from 'vue';
import MkMediaVideoDialog from './media-video-dialog.vue';

export default Vue.extend({
	props: ['video', 'inlinePlayable'],
	computed: {
		imageStyle(): any {
			return {
				'background-image': `url(${this.video.url}?thumbnail&size=512)`
			};
		}
	},
	methods: {
		onClick() {
			const videoTag = this.$refs.video as (HTMLVideoElement | null)
			var start = 0
			if (videoTag) {
				start = videoTag.currentTime
				videoTag.pause()
			}
			(this as any).os.new(MkMediaVideoDialog, {
				video: this.video,
				start,
			})
		}
	}
})
</script>

<style lang="stylus" scoped>
.mk-media-video
	display block
	width 100%
	height 100%
	border-radius 4px
.mk-media-video-thumbnail
	display flex
	justify-content center
	align-items center
	font-size 3.5em

	cursor zoom-in
	overflow hidden
	background-position center
	background-size cover
	width 100%
	height 100%
</style>
