<template>
<div class="qjewsnkg" v-if="hide" @click="hide = false">
	<ImgWithBlurhash class="bg" :hash="image.blurhash" :title="image.name" :alt="image.comment"/>
	<div class="text">
		<div>
			<b><i class="fas fa-exclamation-triangle"></i> {{ $ts.sensitive }}</b>
			<span>{{ $ts.clickToShow }}</span>
		</div>
	</div>
</div>
<div class="gqnyydlz" :style="{ background: color }" v-else>
	<a
		:href="image.url"
		:title="image.name"
		@click.prevent="onClick"
	>
		<ImgWithBlurhash :hash="image.blurhash" :src="url" :alt="image.comment" :title="image.name" :cover="false"/>
		<div class="gif" v-if="image.type === 'image/gif'">GIF</div>
	</a>
	<i class="fas fa-eye-slash" @click="hide = true"></i>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getStaticImageUrl } from '@client/scripts/get-static-image-url';
import { extractAvgColorFromBlurhash } from '@client/scripts/extract-avg-color-from-blurhash';
import ImageViewer from './image-viewer.vue';
import ImgWithBlurhash from '@client/components/img-with-blurhash.vue';
import * as os from '@client/os';

export default defineComponent({
	components: {
		ImgWithBlurhash
	},
	props: {
		image: {
			type: Object,
			required: true
		},
		raw: {
			default: false
		}
	},
	data() {
		return {
			hide: true,
			color: null,
		};
	},
	computed: {
		url(): any {
			let url = this.$store.state.disableShowingAnimatedImages
				? getStaticImageUrl(this.image.thumbnailUrl)
				: this.image.thumbnailUrl;

			if (this.raw || this.$store.state.loadRawImages) {
				url = this.image.url;
			}

			return url;
		}
	},
	created() {
		// Plugin:register_note_view_interruptor を使って書き換えられる可能性があるためwatchする
		this.$watch('image', () => {
			this.hide = (this.$store.state.nsfw === 'force') ? true : this.image.isSensitive && (this.$store.state.nsfw !== 'ignore');
			if (this.image.blurhash) {
				this.color = extractAvgColorFromBlurhash(this.image.blurhash);
			}
		}, {
			deep: true,
			immediate: true,
		});
	},
	methods: {
		onClick() {
			if (this.$store.state.imageNewTab) {
				window.open(this.image.url, '_blank');
			} else {
				os.popup(ImageViewer, {
					image: this.image
				}, {}, 'closed');
			}
		}
	}
});
</script>

<style lang="scss" scoped>
.qjewsnkg {
	position: relative;

	> .bg {
		filter: brightness(0.5);
	}

	> .text {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
		display: flex;
		justify-content: center;
		align-items: center;

		> div {
			display: table-cell;
			text-align: center;
			font-size: 0.8em;
			color: #fff;

			> * {
				display: block;
			}
		}
	}
}

.gqnyydlz {
	position: relative;
	border: solid 0.5px var(--divider);

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
		display: block;
		cursor: zoom-in;
		overflow: hidden;
		width: 100%;
		height: 100%;
		background-position: center;
		background-size: contain;
		background-repeat: no-repeat;

		> .gif {
			background-color: var(--fg);
			border-radius: 6px;
			color: var(--accentLighten);
			display: inline-block;
			font-size: 14px;
			font-weight: bold;
			left: 12px;
			opacity: .5;
			padding: 0 6px;
			text-align: center;
			top: 12px;
			pointer-events: none;
		}
	}
}
</style>
