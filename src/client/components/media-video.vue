<template>
<div class="kkjnbbplepmiyuadieoenjgutgcmtsvu">
	<div class="icozogqfvdetwohsdglrbswgrejoxbdj" v-show="hide" @click="onShow">
		<div>
			<b><Fa :icon="faExclamationTriangle"/> {{ $ts.sensitive }}</b>
			<span>{{ $ts.clickToShow }}</span>
		</div>
	</div>
	<div class="video-container" v-show="hide === false">
		<i><Fa :icon="faEyeSlash" @click="onHide"/></i>
		<video
			ref="videoCast"
			class="video-js vjs-default-skin vjs-big-play-centered vjs-fluid"
		>
		</video>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faExclamationTriangle, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import * as os from '@/os';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

export default defineComponent({
	props: {
		video: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			hide: true,
			faExclamationTriangle,
			faEyeSlash,
			player: null,
		};
	},
	computed: {
	},
	created() {
		this.hide = (this.$store.state.nsfw === 'force') ? true : this.video.isSensitive && (this.$store.state.nsfw !== 'ignore');
	},
	mounted() {
		this.$nextTick(() => {
			this.player = videojs(this.$refs.videoCast, {
				autoplay: false,
				controls: true,
				preload: "metadata",
				playbackRates: [0.5, 0.7, 1.0, 1.5, 2.0, 2.5, 3.1],
				poster: this.video.thumbnailUrl,
				sources: [{
					src: this.video.url,
					type: this.video.type,
				}]
			}, () => {
				// console.log('onPlayerReady', this.video);
			});
		});
	},
	methods: {
		onShow() {
			this.hide = false;
		},
		onHide() {
			this.hide = true;
			this.player.pause();
		},
	},
});
</script>

<style lang="scss" scoped>
.kkjnbbplepmiyuadieoenjgutgcmtsvu {
	position: relative;

	> .icozogqfvdetwohsdglrbswgrejoxbdj {
		display: flex;
		justify-content: center;
		align-items: center;
		background: #111;
		color: #fff;
		height: 100%;

		> div {
			display: table-cell;
			text-align: center;
			font-size: 12px;

			> b {
				display: block;
			}
		}
	}

	> div.video-container {
		display: flex;
		justify-content: center;
		align-items: center;

		overflow: hidden;
		background-position: center;
		background-size: cover;
		width: 100%;
		height: 100%;
		
		> i {
			display: block;
			position: absolute;
			border-radius: 6px;
			background-color: var(--fg);
			color: var(--accentLighten);
			font-size: 14px;
			opacity: .5;
			padding: 3px 6px;
			text-align: center;
			cursor: pointer;
			top: 12px;
			right: 12px;
			z-index: 1;
		}
	}
}
</style>
