<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="mk-app">
	<div v-if="!narrow && !isRoot" class="side">
		<div class="banner" :style="{ backgroundImage: instance.backgroundImageUrl ? `url(${ instance.backgroundImageUrl })` : 'none' }"></div>
		<div class="dashboard">
			<MkVisitorDashboard/>
		</div>
	</div>

	<div :class="$style.main">
		<button v-if="!isRoot" :class="$style.homeButton" class="_button" @click="goHome">
			<i class="ti ti-home"></i>
		</button>
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

.homeButton {
	position: fixed;
	z-index: 1000;
	bottom: 16px;
	right: 16px;
	width: 60px;
	height: 60px;
	background: var(--MI_THEME-panel);
	border-radius: 999px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.side {
	position: relative;
	width: 500px;
	overflow-y: scroll;
	background: var(--MI_THEME-accent);
}

.banner {
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

.dashboard {
	padding: 32px;
}

.content {
	display: flex;
	flex-direction: column;
	height: 100dvh;
}
</style>
