<template>
<div class="uofhebxjdgksfmltszlxurtjnjjsvioh" v-if="video.isSensitive && hide" @click="hide = false">
	<div>
		<b>%fa:exclamation-triangle% %i18n:@sensitive%</b>
		<span>%i18n:@click-to-show%</span>
	</div>
</div>
<div class="vwxdhznewyashiknzolsoihtlpicqepe" v-else>
	<video class="video"
		:src="video.url"
		:title="video.name"
		controls
		@dblclick.prevent="onClick"
		ref="video"
		v-if="inlinePlayable" />
	<a class="thumbnail"
		:href="video.url"
		:style="imageStyle"
		@click.prevent="onClick"
		:title="video.name"
		v-else>
		%fa:R play-circle%
	</a>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import MkMediaVideoDialog from './media-video-dialog.vue';

export default Vue.extend({
	props: {
		video: {
			type: Object,
			required: true
		},
		inlinePlayable: {
			default: false
		},
		hide: {
			type: Boolean,
			default: true
		}
	},
	computed: {
		imageStyle(): any {
			return {
				'background-image': `url(${this.video.url})`
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
.vwxdhznewyashiknzolsoihtlpicqepe
	.video
		display block
		width 100%
		height 100%
		border-radius 4px

	.thumbnail
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

.uofhebxjdgksfmltszlxurtjnjjsvioh
	display flex
	justify-content center
	align-items center
	background #111
	color #fff

	> div
		display table-cell
		text-align center
		font-size 12px

		> b
			display block
</style>
