<template>
<div class="icozogqfvdetwohsdglrbswgrejoxbdj" v-if="hide" @click="hide = false">
	<div>
		<b><Fa :icon="faExclamationTriangle"/> {{ $ts.sensitive }}</b>
		<span>{{ $ts.clickToShow }}</span>
	</div>
</div>
<div class="kkjnbbplepmiyuadieoenjgutgcmtsvu" v-else>
	<i><Fa :icon="faEyeSlash" @click="hide = true"/></i>
	<a
		:id="video.id"
		:style="imageStyle"
		@click="onPlay"
	>
		<Fa :icon="faPlayCircle"/>
	</a>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPlayCircle } from '@fortawesome/free-regular-svg-icons';
import { faExclamationTriangle, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import * as os from '@/os';
import DPlayer from 'dplayer';

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
			faPlayCircle,
			faExclamationTriangle,
			faEyeSlash,
			dp: null,
		};
	},
	computed: {
		imageStyle(): any {
			return {
				'background-image': `url(${this.video.thumbnailUrl})`
			};
		}
	},
	created() {
		this.hide = (this.$store.state.nsfw === 'force') ? true : this.video.isSensitive && (this.$store.state.nsfw !== 'ignore');
	},
	methods: {
		onPlay() {
			if (this.dp === null) {
				// Only for creating new
				this.dp = new DPlayer({
					// Configure parameters
					container: document.getElementById(this.video.id),
					autoplay: true,
					// theme: '#96baf3',
					loop: false,
					lang: 'zh-cn',
					preload: 'auto',
					volume: 0.7,
					video: {
						url: this.video.url,
						pic: this.video.thumbnailUrl,
						thumbnails: this.video.thumbnailUrl,
						type: 'auto',
					},
				});
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.kkjnbbplepmiyuadieoenjgutgcmtsvu {
	position: relative;

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
	}

	> a {
		display: flex;
		justify-content: center;
		align-items: center;

		overflow: hidden;
		background-position: center;
		background-size: cover;
		width: 100%;
		height: 100%;

		> svg {
			// Only for Play button
			font-size: 3.5em;
		}
	}
}

.icozogqfvdetwohsdglrbswgrejoxbdj {
	display: flex;
	justify-content: center;
	align-items: center;
	background: #111;
	color: #fff;

	> div {
		display: table-cell;
		text-align: center;
		font-size: 12px;

		> b {
			display: block;
		}
	}
}
</style>
