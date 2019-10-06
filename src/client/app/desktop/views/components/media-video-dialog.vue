<template>
<div class="mk-media-video-dialog" v-hotkey.global="keymap">
	<div class="bg" @click="close"></div>
	<video :src="video.url" :title="video.name" controls autoplay ref="video" @volumechange="volumechange"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import anime from 'animejs';

export default Vue.extend({
	props: ['video', 'start'],
	mounted() {
		anime({
			targets: this.$el,
			opacity: 1,
			duration: 100,
			easing: 'linear'
		});
		const videoTag = this.$refs.video as HTMLVideoElement;
		if (this.start) videoTag.currentTime = this.start
		videoTag.volume = this.$store.state.device.mediaVolume;
	},
	computed: {
		keymap(): any {
			return {
				'esc': this.close,
			};
		}
	},
	methods: {
		close() {
			anime({
				targets: this.$el,
				opacity: 0,
				duration: 100,
				easing: 'linear',
				complete: () => this.destroyDom()
			});
		},
		volumechange() {
			const videoTag = this.$refs.video as HTMLVideoElement;
			this.$store.commit('device/set', { key: 'mediaVolume', value: videoTag.volume });
		},
	}
});
</script>

<style lang="stylus" scoped>
.mk-media-video-dialog
	display block
	position fixed
	z-index 2048
	top 0
	left 0
	width 100%
	height 100%
	opacity 0

	> .bg
		display block
		position fixed
		z-index 1
		top 0
		left 0
		width 100%
		height 100%
		background rgba(#000, 0.7)

	> video
		position fixed
		z-index 2
		top 0
		right 0
		bottom 0
		left 0
		max-width 80vw
		max-height 80vh
		margin auto

</style>
