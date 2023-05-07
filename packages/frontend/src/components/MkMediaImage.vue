<template>
<div v-if="hide" :class="$style.hidden" @click="hide = false">
	<ImgWithBlurhash style="filter: brightness(0.5);" :hash="image.blurhash" :title="image.comment" :alt="image.comment" :width="image.properties.width" :height="image.properties.height" :force-blurhash="defaultStore.state.enableDataSaverMode"/>
	<div :class="$style.hiddenText">
		<div :class="$style.hiddenTextWrapper">
			<b v-if="image.isSensitive" style="display: block;"><i class="ti ti-alert-triangle"></i> {{ i18n.ts.sensitive }}{{ defaultStore.state.enableDataSaverMode ? ` (${i18n.ts.image}${image.size ? ' ' + bytes(image.size) : ''})` : '' }}</b>
			<b v-else style="display: block;"><i class="ti ti-photo"></i> {{ defaultStore.state.enableDataSaverMode && image.size ? bytes(image.size) : i18n.ts.image }}</b>
			<span style="display: block;">{{ i18n.ts.clickToShow }}</span>
		</div>
	</div>
</div>
<div v-else :class="$style.visible" :style="darkMode ? '--c: rgb(255 255 255 / 2%);' : '--c: rgb(0 0 0 / 2%);'">
	<a
		:class="$style.imageContainer"
		:href="image.url"
		:title="image.name"
	>
		<ImgWithBlurhash :hash="image.blurhash" :src="url" :alt="image.comment || image.name" :title="image.comment || image.name" :width="image.properties.width" :height="image.properties.height" :cover="false"/>
	</a>
	<div :class="$style.indicators">
		<div v-if="['image/gif', 'image/apng'].includes(image.type)" :class="$style.indicator">GIF</div>
		<div v-if="image.comment" :class="$style.indicator">ALT</div>
		<div v-if="image.isSensitive" :class="$style.indicator" style="color: var(--warn);">NSFW</div>
	</div>
	<button v-tooltip="i18n.ts.hide" :class="$style.hide" class="_button" @click="hide = true"><i class="ti ti-eye-off"></i></button>
	<button :class="$style.menu" class="_button" @click.stop="showMenu"><i class="ti ti-dots"></i></button>
</div>
</template>

<script lang="ts" setup>
import { watch } from 'vue';
import * as misskey from 'misskey-js';
import { getStaticImageUrl } from '@/scripts/media-proxy';
import bytes from '@/filters/bytes';
import ImgWithBlurhash from '@/components/MkImgWithBlurhash.vue';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';
import * as os from '@/os';
import { iAmModerator } from '@/account';

const props = defineProps<{
	image: misskey.entities.DriveFile;
	raw?: boolean;
}>();

let hide = $ref(true);
let darkMode: boolean = $ref(defaultStore.state.darkMode);

const url = $computed(() => (props.raw || defaultStore.state.loadRawImages)
	? props.image.url
	: defaultStore.state.disableShowingAnimatedImages
		? getStaticImageUrl(props.image.url)
		: props.image.thumbnailUrl,
);

// Plugin:register_note_view_interruptor を使って書き換えられる可能性があるためwatchする
watch(() => props.image, () => {
	hide = (defaultStore.state.nsfw === 'force' || defaultStore.state.enableDataSaverMode) ? true : (props.image.isSensitive && defaultStore.state.nsfw !== 'ignore');
}, {
	deep: true,
	immediate: true,
});

function showMenu(ev: MouseEvent) {
	os.popupMenu([...(iAmModerator ? [{
		text: i18n.ts.markAsSensitive,
		icon: 'ti ti-eye-off',
		action: () => {
			os.apiWithDialog('drive/files/update', { fileId: props.image.id, isSensitive: true });
		},
	}] : [])], ev.currentTarget ?? ev.target);
}

</script>

<style lang="scss" module>
.hidden {
	position: relative;
}

.hiddenText {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 1;
	display: flex;
	justify-content: center;
	align-items: center;
}

.hiddenTextWrapper {
	display: table-cell;
	text-align: center;
	font-size: 0.8em;
	color: #fff;
}

.visible {
	position: relative;
	//box-shadow: 0 0 0 1px var(--divider) inset;
	background: var(--bg);
	background-image: linear-gradient(45deg, var(--c) 16.67%, var(--bg) 16.67%, var(--bg) 50%, var(--c) 50%, var(--c) 66.67%, var(--bg) 66.67%, var(--bg) 100%);
	background-size: 16px 16px;
}

.hide {
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
}

.menu {
	display: block;
	position: absolute;
	border-radius: 6px;
	background-color: rgba(0, 0, 0, 0.3);
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	color: #fff;
	font-size: 0.8em;
	padding: 6px 8px;
	text-align: center;
	bottom: 12px;
	right: 12px;
}

.imageContainer {
	display: block;
	cursor: zoom-in;
	overflow: hidden;
	width: 100%;
	height: 100%;
	background-position: center;
	background-size: contain;
	background-repeat: no-repeat;
}

.indicators {
	display: inline-flex;
	position: absolute;
	top: 12px;
	left: 12px;
	text-align: center;
	pointer-events: none;
	opacity: .5;
	font-size: 14px;
	gap: 6px;
}

.indicator {
	/* Hardcode to black because either --bg or --fg makes it hard to read in dark/light mode */
	background-color: black;
	border-radius: 6px;
	color: var(--accentLighten);
	display: inline-block;
	font-weight: bold;
	font-size: 12px;
	padding: 2px 6px;
}
</style>
