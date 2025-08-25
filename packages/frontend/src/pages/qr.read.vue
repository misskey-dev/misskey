<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="$style.root" :style="{
	'--MI-QrReadScrollHeight': scrollContainer ? `${scrollHeight}px` : `calc( 100dvh - var(--MI-minBottomSpacing) )`,
	'--MI-QrReadViewHeight': 'calc(var(--MI-QrReadScrollHeight) - var(--MI-stickyTop, 0px) - var(--MI-stickyBottom, 0px))',
	'--MI-QrReadVideoHeight': 'min(calc(var(--MI-QrReadViewHeight) * 0.3), 512px)',
}">
	<video ref="videoEl" :class="$style.video" autoplay muted playsinline></video>
	<div class="_spacer" :style="{
		'--MI-stickyTop': 'calc(var(--MI-stickyTop, 0px) + var(--MI-QrReadVideoHeight, 0px))',
	}">
		<div class="_gaps" style="padding-bottom: var(--MI-margin);">
			<MkUserInfo v-for="user in users.slice(0, 5)" :key="user.id" :user="user"/>
		</div>
		<div class="_gaps_s">
			<MkA v-for="user in users.slice(5)" :key="user.id" :to="userPage(user)">
				<MkUserCardMini :user="user" />
			</MkA>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import QrScanner from 'qr-scanner';
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import * as misskey from 'misskey-js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import MkUserInfo from '@/components/MkUserInfo.vue';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { userPage } from '@/filters/user.js';
import { getScrollContainer } from '@@/js/scroll.js';

const scrollContainer = shallowRef<HTMLElement | null>(null);
const rootEl = ref<HTMLDivElement | null>(null);
const scrollHeight = ref(window.innerHeight);

const scannerInstance = shallowRef<QrScanner | null>(null);
const uris = ref<string[]>([]);
const usersSource = new Map<string, misskey.entities.UserDetailed | null>();
const users = ref<(misskey.entities.UserDetailed)[]>([]);

const timer = ref<number | null>(null);

function updateUsers() {
	users.value = uris.value.map(uri => usersSource.get(uri)).filter(u => u) as misskey.entities.UserDetailed[];
	updateRequired.value = false;
}

const updateRequired = ref(false);

watch(uris, () => {
	if (timer.value) {
		updateRequired.value = true;
		return;
	}

	updateUsers();

	timer.value = window.setTimeout(() => {
		console.log('Update users after 3 seconds');
		timer.value = null;
		if (updateRequired.value) {
			updateUsers();
		}
	}, 3000) as number;
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

	if (usersSource.has(uri)) return;
	// Start fetching user info
	usersSource.set(uri, null);
	
	await misskeyApi('ap/show', { uri })
		.then(data => {
			if (data.type === 'User') {
				usersSource.set(uri, data.object);
				updateUsers();
			}
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

.listBig {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(405px, 1fr));
	grid-gap: var(--MI-margin);
}

.listMini {
	width: 100%;
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
	grid-gap: 12px;
}
</style>
