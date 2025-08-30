<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="rootEl" :class="$style.root" :style="{
		'--MI-QrReadScrollHeight': scrollContainer ? `${scrollHeight}px` : `calc( 100dvh - var(--MI-minBottomSpacing) )`,
		'--MI-QrReadViewHeight': 'calc(var(--MI-QrReadScrollHeight) - var(--MI-stickyTop, 0px) - var(--MI-stickyBottom, 0px))',
		'--MI-QrReadVideoHeight': 'min(calc(var(--MI-QrReadViewHeight) * 0.3), 512px)',
	}"
>
	<video ref="videoEl" :class="$style.video" autoplay muted playsinline></video>
	<div
		class="_spacer"
		:style="{
			'--MI-stickyTop': 'calc(var(--MI-stickyTop, 0px) + var(--MI-QrReadVideoHeight, 0px))',
		}"
	>
		<MkTab v-model="tab" :class="$style.tab">
			<option value="users">{{ i18n.ts.users }} ({{ users.length }})</option>
			<option value="notes">{{ i18n.ts.notes }} ({{ notes.length }})</option>
		</MkTab>
		<div v-if="tab === 'users'" :class="['_gaps', $style.users]" style="padding-bottom: var(--MI-margin);">
			<MkUserInfo v-for="user in users" :key="user.id" :user="user"/>
		</div>
		<div v-else-if="tab === 'notes'" class="_gaps" style="padding-bottom: var(--MI-margin);">
			<MkNote v-for="note in notes" :key="note.id" :note="note"/>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import QrScanner from 'qr-scanner';
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import * as misskey from 'misskey-js';
import { getScrollContainer } from '@@/js/scroll.js';
import type { ApShowResponse } from 'misskey-js/entities.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import MkUserInfo from '@/components/MkUserInfo.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkNote from '@/components/MkNote.vue';
import MkTab from '@/components/MkTab.vue';

const LIST_RERENDER_INTERVAL = 1500;

const scrollContainer = shallowRef<HTMLElement | null>(null);
const rootEl = ref<HTMLDivElement | null>(null);
const scrollHeight = ref(window.innerHeight);

const tab = ref<'users' | 'notes'>('users');

const scannerInstance = shallowRef<QrScanner | null>(null);

const uris = ref<string[]>([]);
const sources = new Map<string, ApShowResponse | null>();
const users = ref<(misskey.entities.UserDetailed)[]>([]);
const notes = ref<misskey.entities.Note[]>([]);

const timer = ref<number | null>(null);

function updateLists() {
	const results = uris.value.map(uri => sources.get(uri)).filter((r): r is ApShowResponse => !!r);
	users.value = results.filter(r => r.type === 'User').map(r => r.object).filter((u): u is misskey.entities.UserDetailed => !!u);
	notes.value = results.filter(r => r.type === 'Note').map(r => r.object).filter((n): n is misskey.entities.Note => !!n);
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
	const uri = result.data.trim();
	try {
		new URL(uri);
	} catch {
		return;
	}

	if (uris.value[0] !== uri) {
		// 並べ替え
		uris.value = [uri, ...uris.value.slice(0, 29).filter(u => u !== uri)];
	}

	if (sources.has(uri)) return;
	// Start fetching user info
	sources.set(uri, null);

	await misskeyApi('ap/show', { uri })
		.then(data => {
			if (data.type === 'User') {
				sources.set(uri, data);
				tab.value = 'users';
			} else if (data.type === 'Note') {
				sources.set(uri, data);
				tab.value = 'notes';
			}
			updateLists();
		})
		.catch(err => {
			console.error(err);
		});
}

const alertLock = ref(false);

onMounted(() => {
	const videoEl = window.document.querySelector('video');

	if (!videoEl) {
		os.alert({
			type: 'error',
			text: i18n.ts.somethingHappened,
		});
		return;
	}

	scannerInstance.value = new QrScanner(
		videoEl,
		processResult,
		{
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

	scannerInstance.value.start();
});

onUnmounted(() => {
	if (timer.value) {
		window.clearTimeout(timer.value);
		timer.value = null;
	}

	scannerInstance.value?.destroy();
});

//#region scroll height
function checkScrollHeight() {
	scrollHeight.value = scrollContainer.value ? scrollContainer.value.clientHeight : window.innerHeight;
}

let ro: ResizeObserver | undefined;

onMounted(() => {
	scrollContainer.value = getScrollContainer(rootEl.value);
	checkScrollHeight();

	if (scrollContainer.value) {
		ro = new ResizeObserver(checkScrollHeight);
		ro.observe(scrollContainer.value);
	}
});

onUnmounted(() => {
	ro?.disconnect();
});
//#endregion
</script>

<style lang="scss" module>
.root {
	position: relative;
}

.video {
	position: sticky;
	top: var(--MI-stickyTop, 0);
	z-index: 1;
	background: var(--MI_THEME-bg);
	background-size: 16px 16px;
	width: 100%;
	height: var(--MI-QrReadVideoHeight);
	object-fit: contain;
}

html[data-color-scheme=dark] .video {
	--c: rgb(255 255 255 / 2%);
	background-image: linear-gradient(45deg, var(--c) 16.67%, var(--MI_THEME-bg) 16.67%, var(--MI_THEME-bg) 50%, var(--c) 50%, var(--c) 66.67%, var(--MI_THEME-bg) 66.67%, var(--MI_THEME-bg) 100%);
}

html[data-color-scheme=light] .video {
	--c: rgb(0 0 0 / 2%);
	background-image: linear-gradient(45deg, var(--c) 16.67%, var(--MI_THEME-bg) 16.67%, var(--MI_THEME-bg) 50%, var(--c) 50%, var(--c) 66.67%, var(--MI_THEME-bg) 66.67%, var(--MI_THEME-bg) 100%);
}

.users {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	grid-gap: var(--MI-margin);
}
</style>
