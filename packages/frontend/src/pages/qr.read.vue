<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="rootEl"
	:class="$style.root"
	:style="{
		'--MI-QrReadViewHeight': 'calc(100cqh - var(--MI-stickyTop, 0px) - var(--MI-stickyBottom, 0px))',
		'--MI-QrReadVideoHeight': 'min(calc(var(--MI-QrReadViewHeight) * 0.3), 512px)',
	}"
>
	<MkStickyContainer>
		<template #header>
			<div :class="$style.view">
				<video ref="videoEl" :class="$style.video" autoplay muted playsinline></video>
				<div ref="overlayEl"></div>
				<div :class="$style.controls">
					<MkButton v-tooltip="i18n.ts._qr.scanFile" iconOnly @click="upload"><i class="ti ti-photo-plus"></i></MkButton>

					<MkButton v-if="qrStarted" v-tooltip="i18n.ts._qr.stopQr" iconOnly @click="stopQr"><i class="ti ti-player-play"></i></MkButton>
					<MkButton v-else v-tooltip="i18n.ts._qr.startQr" iconOnly danger @click="startQr"><i class="ti ti-player-pause"></i></MkButton>

					<MkButton v-tooltip="i18n.ts._qr.chooseCamera" iconOnly @click="chooseCamera"><i class="ti ti-camera-rotate"></i></MkButton>

					<MkButton v-if="!flashCanToggle" v-tooltip="i18n.ts._qr.cannotToggleFlash" iconOnly disabled><i class="ti ti-bolt"></i></MkButton>
					<MkButton v-else-if="!flash" v-tooltip="i18n.ts._qr.turnOnFlash" iconOnly @click="toggleFlash(true)"><i class="ti ti-bolt-off"></i></MkButton>
					<MkButton v-else v-tooltip="i18n.ts._qr.turnOffFlash" iconOnly @click="toggleFlash(false)"><i class="ti ti-bolt-filled"></i></MkButton>
				</div>
			</div>
		</template>
		<div
			:class="['_spacer', $style.contents]"
			:style="{
				'--MI_SPACER-w': '800px'
			}"
		>
			<MkStickyContainer>
				<template #header>
					<MkTab
						v-model="tab"
						:tabs="[
							{ key: 'users', label: i18n.ts.users },
							{ key: 'notes', label: i18n.ts.notes },
							{ key: 'all', label: i18n.ts.all },
						]"
						:class="$style.tab"
					>
					</MkTab>
				</template>
				<div v-if="tab === 'users'" :class="[$style.users, '_margin']" style="padding-bottom: var(--MI-margin);">
					<MkUserInfo v-for="user in users" :key="user.id" :user="user"/>
				</div>
				<div v-else-if="tab === 'notes'" class="_margin _gaps" style="padding-bottom: var(--MI-margin);">
					<MkNote v-for="note in notes" :key="note.id" :note="note" :class="$style.note"/>
				</div>
				<div v-else-if="tab === 'all'" class="_margin _gaps" style="padding-bottom: var(--MI-margin);">
					<MkQrReadRawViewer v-for="result in Array.from(results).reverse()" :key="result" :data="result"/>
				</div>
			</MkStickyContainer>
		</div>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import QrScanner from 'qr-scanner';
import { onActivated, onDeactivated, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import * as misskey from 'misskey-js';
import { getScrollContainer } from '@@/js/scroll.js';
import type { ApShowResponse } from 'misskey-js/entities.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import MkUserInfo from '@/components/MkUserInfo.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkNote from '@/components/MkNote.vue';
import MkTab from '@/components/MkTab.vue';
import MkButton from '@/components/MkButton.vue';
import MkQrReadRawViewer from '@/pages/qr.read.raw-viewer.vue';

const LIST_RERENDER_INTERVAL = 1500;

const rootEl = useTemplateRef('rootEl');
const videoEl = useTemplateRef('videoEl');
const overlayEl = useTemplateRef('overlayEl');

const scannerInstance = shallowRef<QrScanner | null>(null);

const tab = ref<'users' | 'notes' | 'all'>('users');

// higher is recent
const results = ref(new Set<string>());
// lower is recent
const uris = ref<string[]>([]);
const sources = new Map<string, ApShowResponse | null>();
const users = ref<(misskey.entities.UserDetailed)[]>([]);
const usersCount = ref(0);
const notes = ref<misskey.entities.Note[]>([]);
const notesCount = ref(0);

const timer = ref<number | null>(null);

function updateLists() {
	const responses = uris.value.map(uri => sources.get(uri)).filter((r): r is ApShowResponse => !!r);
	users.value = responses.filter(r => r.type === 'User').map(r => r.object).filter((u): u is misskey.entities.UserDetailed => !!u);
	usersCount.value = users.value.length;
	notes.value = responses.filter(r => r.type === 'Note').map(r => r.object).filter((n): n is misskey.entities.Note => !!n);
	notesCount.value = notes.value.length;
	updateRequired.value = false;
}

const updateRequired = ref(false);

watch(uris, () => {
	if (timer.value) {
		updateRequired.value = true;
		return;
	}

	updateLists();

	timer.value = window.setTimeout(() => {
		timer.value = null;
		if (updateRequired.value) {
			updateLists();
		}
	}, LIST_RERENDER_INTERVAL) as number;
});

watch(tab, () => {
	if (timer.value) {
		window.clearTimeout(timer.value);
		timer.value = null;
	}
	updateLists();
});

async function processResult(result: QrScanner.ScanResult) {
	if (!result) return;
	const trimmed = result.data.trim();

	if (!trimmed) return;

	const haveExisted = results.value.has(trimmed);
	results.value.add(trimmed);

	try {
		new URL(trimmed);
	} catch {
		if (!haveExisted) {
			tab.value = 'all';
		}
		return;
	}

	if (uris.value[0] !== trimmed) {
		// 並べ替え
		uris.value = [trimmed, ...uris.value.slice(0, 29).filter(u => u !== trimmed)];
	}

	if (sources.has(trimmed)) return;
	// Start fetching user info
	sources.set(trimmed, null);

	await misskeyApi('ap/show', { uri: trimmed })
		.then(data => {
			if (data.type === 'User') {
				sources.set(trimmed, data);
				tab.value = 'users';
			} else if (data.type === 'Note') {
				sources.set(trimmed, data);
				tab.value = 'notes';
			}
			updateLists();
		})
		.catch(err => {
			tab.value = 'all';
			throw err;
		});
}

const qrStarted = ref(true);
const flashCanToggle = ref(false);
const flash = ref(false);

async function upload() {
	os.chooseFileFromPc({ multiple: true }).then(files => {
		if (files.length === 0) return;
		for (const file of files) {
			QrScanner.scanImage(file, { returnDetailedScanResult: true })
				.then(result => {
					processResult(result);
				})
				.catch(err => {
					if (err.toString().includes('No QR code found')) {
						os.alert({
							type: 'info',
							text: i18n.ts._qr.noQrCodeFound,
						});
					} else {
						os.alert({
							type: 'error',
							text: err.toString(),
						});
						console.error(err);
					}
				});
		}
	});
}

async function chooseCamera() {
	if (!scannerInstance.value) return;
	const cameras = await QrScanner.listCameras(true);
	if (cameras.length === 0) {
		os.alert({
			type: 'error',
		});
		return;
	}

	const select = await os.select({
		title: i18n.ts._qr.chooseCamera,
		items: cameras.map(camera => ({
			label: camera.label,
			value: camera.id,
		})),
	});
	if (select.canceled) return;
	if (select.result == null) return;

	await scannerInstance.value.setCamera(select.result);
	flashCanToggle.value = await scannerInstance.value.hasFlash();
	flash.value = scannerInstance.value.isFlashOn();
}

async function toggleFlash(to = false) {
	if (!scannerInstance.value) return;

	flash.value = to;
	if (flash.value) {
		await scannerInstance.value.turnFlashOn();
	} else {
		await scannerInstance.value.turnFlashOff();
	}
}

async function startQr() {
	if (!scannerInstance.value) return;
	await scannerInstance.value.start();
	qrStarted.value = true;
}

function stopQr() {
	if (!scannerInstance.value) return;
	scannerInstance.value.stop();
	qrStarted.value = false;
}

onActivated(() => {
	startQr;
});

onDeactivated(() => {
	stopQr;
});

const alertLock = ref(false);

onMounted(() => {
	if (!videoEl.value || !overlayEl.value) {
		os.alert({
			type: 'error',
			text: i18n.ts.somethingHappened,
		});
		return;
	}

	scannerInstance.value = new QrScanner(
		videoEl.value,
		processResult,
		{
			highlightScanRegion: true,
			highlightCodeOutline: true,
			overlay: overlayEl.value,
			calculateScanRegion(video: HTMLVideoElement): QrScanner.ScanRegion {
				const aspectRatio = video.videoWidth / video.videoHeight;
				const SHORT_SIDE_SIZE_DOWNSCALED = 360;
				return {
					x: 0,
					y: 0,
					width: video.videoWidth,
					height: video.videoHeight,
					downScaledWidth: aspectRatio > 1 ? Math.round(SHORT_SIDE_SIZE_DOWNSCALED * aspectRatio) : SHORT_SIDE_SIZE_DOWNSCALED,
					downScaledHeight: aspectRatio > 1 ? SHORT_SIDE_SIZE_DOWNSCALED : Math.round(SHORT_SIDE_SIZE_DOWNSCALED / aspectRatio),
				};
			},
			onDecodeError(err) {
				if (err.toString().includes('No QR code found')) return;
				if (alertLock.value) return;
				alertLock.value = true;
				os.alert({
					type: 'error',
					text: err.toString(),
				}).finally(() => {
					alertLock.value = false;
				});
			},
		},
	);

	scannerInstance.value.start()
		.then(async () => {
			qrStarted.value = true;
			if (!scannerInstance.value) return;
			flashCanToggle.value = await scannerInstance.value.hasFlash();
			flash.value = scannerInstance.value.isFlashOn();
		})
		.catch(err => {
			qrStarted.value = false;
			os.alert({
				type: 'error',
				text: err.toString(),
			});
			console.error(err);
		});
});

onUnmounted(() => {
	if (timer.value) {
		window.clearTimeout(timer.value);
		timer.value = null;
	}

	scannerInstance.value?.destroy();
});
</script>

<style lang="scss" module>
.root {
	position: relative;
}

.view {
	position: sticky;
	top: var(--MI-stickyTop, 0);
	z-index: 1;
	background: var(--MI_THEME-bg);
	background-size: 16px 16px;
	width: 100%;
	height: var(--MI-QrReadVideoHeight);
}

.video {
	width: 100%;
	height: 100%;
	object-fit: contain;
}

.controls {
	width: 100%;
	position: absolute;
	right: 10px;
	bottom: 10px;
	display: flex;
	justify-content: end;
	align-items: center;
	gap: 10px;
}

html[data-color-scheme=dark] .view {
	--c: rgb(255 255 255 / 2%);
	background-image: linear-gradient(45deg, var(--c) 16.67%, var(--MI_THEME-bg) 16.67%, var(--MI_THEME-bg) 50%, var(--c) 50%, var(--c) 66.67%, var(--MI_THEME-bg) 66.67%, var(--MI_THEME-bg) 100%);
}

html[data-color-scheme=light] .view {
	--c: rgb(0 0 0 / 2%);
	background-image: linear-gradient(45deg, var(--c) 16.67%, var(--MI_THEME-bg) 16.67%, var(--MI_THEME-bg) 50%, var(--c) 50%, var(--c) 66.67%, var(--MI_THEME-bg) 66.67%, var(--MI_THEME-bg) 100%);
}

.contents {
	padding-top: calc(var(--MI-margin) / 2);
}

.tab {
	padding: calc(var(--MI-margin) / 2) 0;
	background: var(--MI_THEME-bg);
}

.users {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	grid-gap: var(--MI-margin);
}

.note {
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
}
</style>
