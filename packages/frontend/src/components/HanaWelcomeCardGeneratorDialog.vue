<template>
<MkModalWindow
	ref="dialogEl"
	:width="1000"
	:height="600"
	:scroll="false"
	:withOkButton="false"
	@close="cancel"
	@closed="$emit('closed')"
>
	<template #header><i class="ti ti-hanamisskey-hanamode"></i> {{ i18n.ts._hana._welcomeCardGen.title }}</template>

	<div :class="$style.hanaWelcomeCardGenRoot">
		<Transition
			mode="out-in"
			:enterActiveClass="$style.transition_x_enterActive"
			:leaveActiveClass="$style.transition_x_leaveActive"
			:enterFromClass="$style.transition_x_enterFrom"
			:leaveToClass="$style.transition_x_leaveTo"
		>
			<div v-if="phase === 'input'" key="input" :class="$style.hanaWelcomeCardGenInputRoot">
				<div :class="$style.hanaWelcomeCardGenPreviewRoot">
					<MkLoading v-if="canvasLoading" :class="$style.hanaWelcomeCardGenPreviewSpinner"/>
					<div :class="$style.hanaWelcomeCardGenPreviewWrapper">
						<div :class="$style.hanaWelcomeCardGenPreviewTitle">{{ i18n.ts.preview }}</div>
						<div inert :class="$style.hanaWelcomeCardGenPreviewInert">
							<canvas
								ref="canvasEl"
								:class="$style.hanaWelcomeCardGenPreviewCanvas"
							></canvas>
						</div>
					</div>
				</div>
				<div :class="$style.hanaWelcomeCardGenSettings" class="_gaps">
					<MkInput v-model="name" :disabled="canvasLoading">
						<template #label>{{ i18n.ts.name }}</template>
						<template #caption>{{ i18n.ts._hana._welcomeCardGen.nameDescription }}</template>
					</MkInput>
					<div class="_buttons">
						<MkButton :disabled="canvasLoading" @click="applyToPreview">{{ i18n.ts._hana._welcomeCardGen.applyToPreview }}</MkButton>
						<MkButton :disabled="canvasLoading" primary @click="generate">{{ i18n.ts._hana._welcomeCardGen.generateImage }} <i class="ti ti-arrow-right"></i></MkButton>
					</div>
				</div>
			</div>
			<div v-else-if="phase === 'share'" key="share" :class="$style.hanaWelcomeCardGenResultRoot">
				<div :class="$style.hanaWelcomeCardGenResultWrapper" class="_gaps">
					<div class="_gaps_s">
						<div :class="$style.hanaWelcomeCardGenResultHeadingIcon"><i class="ti ti-check"></i></div>
						<div :class="$style.hanaWelcomeCardGenResultHeading">{{ i18n.ts._hana._welcomeCardGen.imageGenerated }}</div>
						<div :class="$style.hanaWelcomeCardGenResultDescription">{{ i18n.ts._hana._welcomeCardGen.imageGeneratedDescription }}</div>
					</div>
					<img v-if="resultUrl" :class="$style.hanaWelcomeCardGenResultImage" :src="resultUrl" alt="Generated image"/>
					<div class="_buttonsCenter">
						<MkButton rounded @click="note"><i class="ti ti-pencil"></i> {{ i18n.ts.note }}</MkButton>
						<MkButton rounded @click="download"><i class="ti ti-download"></i> {{ i18n.ts.download }}</MkButton>
						<MkButton rounded @click="postToX"><i class="ti ti-brand-x"></i> {{ i18n.ts._hana._welcomeCardGen.shareToX }}</MkButton>
					</div>
					<div :class="$style.hanaWelcomeCardGenResultWarning">{{ i18n.ts._hana._welcomeCardGen.shareWarning }}</div>
					<div class="_buttonsCenter">
						<MkButton rounded transparent @click="returnToInput"><i class="ti ti-arrow-left"></i> {{ i18n.ts.goBack }}</MkButton>
						<MkButton rounded transparent @click="closeAndNotShowAgain">{{ i18n.ts.close }}</MkButton>
					</div>
				</div>
			</div>
		</Transition>
	</div>
</MkModalWindow>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onDeactivated, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';
import { ensureSignin } from '@/i.js';
import { apiUrl, host } from '@@/js/config.js';
import { prefer } from '@/preferences.js';
import { hanaStore } from '@/hana/store.js';
import * as os from '@/os.js';

import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';

const emit = defineEmits<{
	(ev: 'cancel'): void;
	(ev: 'completed'): void;
	(ev: 'closed'): void;
}>();

const $i = ensureSignin();

//#region modalの制御
const dialogEl = shallowRef<InstanceType<typeof MkModalWindow>>();

function cancel() {
	emit('cancel');
	dialogEl.value?.close();
}

function closeAndNotShowAgain() {
	hanaStore.set('neverShowWelcomeCardPopup', true);
	emit('completed');
	cancel();
}

const phase = ref<'input' | 'share'>('input');
//#endregion

//#region canvas
const canvasEl = shallowRef<HTMLCanvasElement>();
const canvasLoading = ref(true);

const name = ref($i.name ?? $i.username);

const fontFace = new FontFace('PlemolJP-HS', 'url(https://static-assets.misskey.flowers/fonts/plemoljp-hs/PlemolJPHS-Bold.woff2)');

const bg = new Image();
bg.crossOrigin = 'anonymous';
const avatar = new Image();
avatar.crossOrigin = 'anonymous';

function drawName(_name: string, ctx?: CanvasRenderingContext2D) {
	let _ctx = ctx ?? null;

	if (!_ctx) {
		const canvas = canvasEl.value;
		if (!canvas) return;
		_ctx = canvas.getContext('2d');
		if (!_ctx) return;
	}

	// 半角換算で26文字まで（全角は2文字扱い）
	function truncateName(str: string) {
		let out = '';
		let len = 0;
		for (let i = 0; i < str.length; i++) {
			const c = str[i];
			len += c.match(/[^\x01-\x7E]/) ? 2 : 1;
			if (len > 26) break;
			out += c;
		}
		return out;
	}

	_ctx.font = 'bold 63.5px "PlemolJP-HS"';
	_ctx.fillStyle = '#000';
	_ctx.fillText(truncateName(_name), 327, 268.3);
}

async function initCanvas() {
	const canvas = canvasEl.value;
	if (!canvas) return;

	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	canvasLoading.value = true;

	function loadBg() {
		return new Promise<void>(resolve => {
			bg.addEventListener('load', () => {
				canvas!.width = 1280;
				canvas!.height = 670;
				ctx!.drawImage(bg, 0, 0, 1280, 670);
				resolve();
			});
			bg.src = 'https://static-assets.misskey.flowers/misc/welcome-card/hana_welcome.png';
		});
	}

	function loadAvatar() {
		return new Promise<void>(resolve => {
			avatar.addEventListener('load', () => {
				const radius = 98.8;
				const avatarCenterX = 175.2;
				const avatarCenterY = 272.7;

				const avatarImageHeight = Math.max(avatar.height * (radius * 2 / avatar.width), radius * 2);
				const avatarImageWidth = Math.max(avatar.width * (radius * 2 / avatar.height), radius * 2);
				const avatarImageDX = avatarCenterX - avatarImageWidth / 2;
				const avatarImageDY = avatarCenterY - avatarImageHeight / 2;

				// 丸型に切り抜いて描画
				ctx!.save();
				ctx!.beginPath();
				ctx!.arc(avatarCenterX, avatarCenterY, radius, 0, Math.PI * 2);
				ctx!.clip();
				ctx!.drawImage(avatar, avatarImageDX, avatarImageDY, avatarImageWidth, avatarImageHeight);
				ctx!.restore();
				resolve();
			});
			avatar.src = $i.avatarUrl ?? '/static-assets/avatar.png';
		});
	}

	await fontFace.load();
	window.document.fonts.add(fontFace);

	await loadBg();
	await loadAvatar();

	// draw joined date
	ctx!.font = 'bold 47.6px "PlemolJP-HS"';
	ctx!.fillStyle = '#000';
	const threeLetterMonth = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
	const createdAt = new Date($i.createdAt);
	const year = createdAt.getFullYear().toString().slice(-2);
	const month = threeLetterMonth[createdAt.getMonth()];
	const date = createdAt.getDate().toString().padStart(2, '0');
	ctx!.fillText(`${date}${month}${year}`, 327, 420.5);

	// draw acct
	ctx!.font = 'bold 37px "PlemolJP-HS"';
	ctx!.fillStyle = '#888';
	ctx!.fillText(`@${$i.username}@${host}`, 327, 313.5);

	// draw name
	drawName(name.value, ctx);

	canvasLoading.value = false;
}

function applyToPreview() {
	initCanvas();
}
//#endregion

//#region export as image
const result = shallowRef<Blob | null>(null);
const resultUrl = ref<string | null>(null);

function returnToInput() {
	result.value = null;
	resultUrl.value = null;
	phase.value = 'input';

	watch(canvasEl, () => {
		initCanvas();
	}, { once: true });
}

async function generate() {
	if (!canvasEl.value) return;

	await initCanvas();

	canvasEl.value.toBlob(blob => {
		if (!blob) return;
		result.value = blob;
		const url = URL.createObjectURL(blob);
		resultUrl.value = url;

		phase.value = 'share';
	}, 'image/png');
}

function postToX() {
	const url = new URL('https://x.com/intent/tweet');
	url.searchParams.set('text', i18n.tsx._hana._welcomeCardGen.shareTextForX({ url: `https://${host}/@${$i.username}` }));
	url.searchParams.set('url', '');

	window.open(url.toString(), '_blank', 'noopener,noreferrer');
}

function download() {
	if (!result.value) return;

	const a = window.document.createElement('a');
	a.href = URL.createObjectURL(result.value);
	a.download = `hana-welcome-card-${Date.now()}.png`;
	a.click();
	a.remove();
}

async function note() {
	if (!result.value) return;

	const uploadPromise: Promise<Misskey.entities.DriveFile | null> = (async () => {
		const formData = new FormData();
		formData.append('file', result.value!);
		formData.append('name', `hana-welcome-card-${Date.now()}.png`);
		formData.append('isSensitive', 'false');
		formData.append('i', $i.token);
		if (prefer.s.uploadFolder) {
			formData.append('folderId', prefer.s.uploadFolder);
		}

		const res = await window.fetch(apiUrl + '/drive/files/create', {
			method: 'POST',
			body: formData,
		});

		if (res.ok) {
			return await res.json();
		} else {
			return null;
		}
	})();

	os.promiseDialog(uploadPromise);

	const file = await uploadPromise;

	if (!file) return;

	os.post({
		initialText: i18n.tsx._hana._welcomeCardGen.shareText({ url: `https://${host}/@${$i.username}` }),
		initialFiles: [file],
		instant: true,
	});
}
//#endregion

onMounted(() => {
	initCanvas();
});

onDeactivated(() => {
	canvasLoading.value = true;
	result.value = null;
	resultUrl.value = null;
});
</script>

<style module lang="scss">
.transition_x_enterActive,
.transition_x_leaveActive {
	transition: opacity 0.3s cubic-bezier(0,0,.35,1), transform 0.3s cubic-bezier(0,0,.35,1);
}
.transition_x_enterFrom {
	opacity: 0;
	transform: translateX(50px);
}
.transition_x_leaveTo {
	opacity: 0;
	transform: translateX(-50px);
}

.hanaWelcomeCardGenRoot {
	container-type: inline-size;
	height: 100%;
}

.hanaWelcomeCardGenInputRoot {
	height: 100%;
	display: grid;
	grid-template-columns: 1fr 400px;
}

.hanaWelcomeCardGenPreviewRoot {
	position: relative;
	background-color: var(--MI_THEME-bg);
	cursor: not-allowed;
}

.hanaWelcomeCardGenPreviewWrapper {
	display: flex;
	flex-direction: column;
	height: 100%;
	pointer-events: none;
	user-select: none;
	-webkit-user-drag: none;
}

.hanaWelcomeCardGenPreviewTitle {
	width: fit-content;
	flex-shrink: 0;
	padding: 0 8px;
	background-color: var(--MI_THEME-panel);
	border-right: 1px solid var(--MI_THEME-divider);
	border-bottom: 1px solid var(--MI_THEME-divider);
	border-bottom-right-radius: var(--MI-radius);
	height: 28px;
	line-height: 28px;
	box-sizing: border-box;
}

.hanaWelcomeCardGenPreviewSpinner {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	pointer-events: none;
	user-select: none;
	-webkit-user-drag: none;
}

.hanaWelcomeCardGenPreviewInert {
	flex: 1;
	display: flex;
	justify-content: center;
	align-items: center;
	padding: var(--MI-margin);
}

.hanaWelcomeCardGenPreviewCanvas {
	width: 100%;
	height: auto;
}

.hanaWelcomeCardGenSettings {
	padding: 24px;
	overflow-y: scroll;
}

.hanaWelcomeCardGenResultRoot {
	box-sizing: border-box;
	padding: 24px;
	height: 100%;
	max-width: 700px;
	margin: 0 auto;
}

.hanaWelcomeCardGenResultHeading {
	text-align: center;
	font-size: 1.2em;
}

.hanaWelcomeCardGenResultHeadingIcon {
	margin: 0 auto;
	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	text-align: center;
	height: 64px;
	width: 64px;
	font-size: 24px;
	line-height: 64px;
	border-radius: 50%;
}

.hanaWelcomeCardGenResultDescription {
	text-align: center;
	white-space: pre-wrap;
}

.hanaWelcomeCardGenResultWrapper {
	width: 100%;
	height: 100%;
}

.hanaWelcomeCardGenResultImage {
	width: auto;
	height: auto;
	min-height: 0;
	object-fit: contain;
}

.hanaWelcomeCardGenResultWarning {
	text-align: center;
	font-size: 0.8em;
	opacity: 0.7;
	white-space: pre-wrap;
}

@container (max-width: 800px) {
	.hanaWelcomeCardGenInputRoot {
		grid-template-columns: 1fr;
		grid-template-rows: 1fr 1fr;
	}
}
</style>
