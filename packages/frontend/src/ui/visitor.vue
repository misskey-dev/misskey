<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<a v-if="isRoot" href="https://github.com/misskey-dev/misskey" target="_blank" class="github-corner" aria-label="View source on GitHub"><svg width="80" height="80" viewBox="0 0 250 250" style="fill:var(--MI_THEME-panel); color:var(--MI_THEME-fg); position: fixed; z-index: 10; top: 0; border: 0; right: 0;" aria-hidden="true"><path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path><path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style="transform-origin: 130px 106px;" class="octo-arm"></path><path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" class="octo-body"></path></svg></a>

	<div v-if="!narrow && !isRoot" :class="$style.side">
		<div :class="$style.sideBanner" :style="{ backgroundImage: instance.backgroundImageUrl ? `url(${ instance.backgroundImageUrl })` : 'none' }"></div>
		<div :class="$style.sideDashboard">
			<MkVisitorDashboard/>
		</div>
	</div>

	<div :class="$style.main">
		<div v-if="narrow && !isRoot" :class="$style.header">
			<img :src="instance.iconUrl || '/favicon.ico'" alt="" :class="$style.headerIcon"/>
			<MkA to="/" :class="$style.headerTitle">{{ instanceName }}</MkA>
			<MkButton primary rounded :class="$style.headerButton" @click="goHome">{{ i18n.ts.signup }}</MkButton>
		</div>
		<div :class="$style.content">
			<RouterView/>
		</div>
	</div>
</div>
<XCommon/>
</template>

<script lang="ts" setup>
import { onMounted, provide, ref, computed } from 'vue';
import { instanceName } from '@@/js/config.js';
import XCommon from './_common_/common.vue';
import type { PageMetadata } from '@/page.js';
import * as os from '@/os.js';
import { instance } from '@/instance.js';
import { provideMetadataReceiver, provideReactiveMetadata } from '@/page.js';
import { i18n } from '@/i18n.js';
import MkVisitorDashboard from '@/components/MkVisitorDashboard.vue';
import { mainRouter } from '@/router.js';
import { DI } from '@/di.js';
import MkButton from '@/components/MkButton.vue';

const isRoot = computed(() => mainRouter.currentRoute.value.name === 'index');

const DESKTOP_THRESHOLD = 1100;

const pageMetadata = ref<null | PageMetadata>(null);

provide(DI.router, mainRouter);
provideMetadataReceiver((metadataGetter) => {
	const info = metadataGetter();
	pageMetadata.value = info;
	if (pageMetadata.value) {
		if (isRoot.value && pageMetadata.value.title === instanceName) {
			window.document.title = pageMetadata.value.title;
		} else {
			window.document.title = `${pageMetadata.value.title} | ${instanceName}`;
		}
	}
});
provideReactiveMetadata(pageMetadata);

const isDesktop = ref(window.innerWidth >= DESKTOP_THRESHOLD);
const narrow = ref(window.innerWidth < 1280);

function goHome() {
	mainRouter.push('/');
}

onMounted(() => {
	if (!isDesktop.value) {
		window.addEventListener('resize', () => {
			if (window.innerWidth >= DESKTOP_THRESHOLD) isDesktop.value = true;
		}, { passive: true });
	}
});
</script>

<style>
.github-corner:hover .octo-arm{animation:octocat-wave 560ms ease-in-out}@keyframes octocat-wave{0%,100%{transform:rotate(0)}20%,60%{transform:rotate(-25deg)}40%,80%{transform:rotate(10deg)}}@media (max-width:500px){.github-corner:hover .octo-arm{animation:none}.github-corner .octo-arm{animation:octocat-wave 560ms ease-in-out}}
</style>

<style lang="scss" module>
.root {
	display: flex;
	height: 100dvh;
	overflow: clip;
}

.main {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-width: 0;
}

.header {
	padding: 16px;
	display: flex;
	align-items: center;
	background: var(--MI_THEME-panel);
}

.headerIcon {
	width: 48px;
	vertical-align: bottom;
	border-radius: 8px;
}

.headerTitle {
	margin: 0 16px;
	font-weight: bold;
}

.headerButton {
	margin-left: auto;
}

.side {
	position: relative;
	width: 500px;
	overflow-y: scroll;
	background: var(--MI_THEME-accent);
}

.sideBanner {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	aspect-ratio: 1.5;
	background-position: center;
	background-size: cover;
	-webkit-mask-image: linear-gradient(rgba(0, 0, 0, 1.0), transparent);
	mask-image: linear-gradient(rgba(0, 0, 0, 1.0), transparent);
}

.sideDashboard {
	padding: 32px;
}

.content {
	display: flex;
	flex-direction: column;
	height: 100dvh;
}
</style>
