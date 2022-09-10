<template>
<div v-if="hide" class="qjewsnkg" @click="hide = false">
	<ImgWithBlurhash class="bg" :hash="image.blurhash" :title="image.comment" :alt="image.comment"/>
	<div class="text">
		<div class="wrapper">
			<b style="display: block;"><i class="fas fa-exclamation-triangle"></i> {{ $ts.sensitive }}</b>
			<span style="display: block;">{{ $ts.clickToShow }}</span>
		</div>
	</div>
</div>
<div v-else class="gqnyydlz">
	<a
		:href="image.url"
		:title="image.name"
	>
		<ImgWithBlurhash :hash="image.blurhash" :src="url" :alt="image.comment" :title="image.comment" :cover="false"/>
		<div v-if="image.type === 'image/gif'" class="gif">GIF</div>
	</a>
	<button v-tooltip="$ts.hide" class="_button hide" @click="hide = true"><i class="fas fa-eye-slash"></i></button>
</div>
</template>

<script lang="ts" setup>
import { watch } from 'vue';
import * as misskey from 'misskey-js';
import { getStaticImageUrl } from '@/scripts/get-static-image-url';
import ImgWithBlurhash from '@/components/MkImgWithBlurhash.vue';
import { defaultStore } from '@/store';

const props = defineProps<{
	image: misskey.entities.DriveFile;
	raw?: boolean;
}>();

let hide = $ref(true);

const url = (props.raw || defaultStore.state.loadRawImages)
	? props.image.url
	: defaultStore.state.disableShowingAnimatedImages
		? getStaticImageUrl(props.image.thumbnailUrl)
		: props.image.thumbnailUrl;

// Plugin:register_note_view_interruptor を使って書き換えられる可能性があるためwatchする
watch(() => props.image, () => {
	hide = (defaultStore.state.nsfw === 'force') ? true : props.image.isSensitive && (defaultStore.state.nsfw !== 'ignore');
}, {
	deep: true,
	immediate: true,
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

		> .wrapper {
			display: table-cell;
			text-align: center;
			font-size: 0.8em;
			color: #fff;
		}
	}
}

.gqnyydlz {
	position: relative;
	//box-shadow: 0 0 0 1px var(--divider) inset;
	background: var(--bg);

	> .hide {
		display: block;
		position: absolute;
		border-radius: 6px;
		background-color: var(--accentedBg);
		-webkit-backdrop-filter: var(--blur, blur(15px));
		backdrop-filter: var(--blur, blur(15px));
		color: var(--accent);
		font-size: 0.8em;
		padding: 6px 8px;
		text-align: center;
		top: 12px;
		right: 12px;

		> i {
			display: block;
		}
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
