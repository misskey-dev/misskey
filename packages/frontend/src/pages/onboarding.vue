<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.onboardingRoot, { [$style.ready]: animationPhase >= 1 }]">
	<MkAnimBg :class="$style.onboardingBg"/>
	<div :class="[$style.onboardingContainer]">
		<div :class="[$style.tutorialTitle, { [$style.showing]: (page !== 0) }]">
			<div :class="$style.text">
				<span v-if="page === 1"><i class="ti ti-pencil"></i> {{ i18n.ts._initialTutorial._note.title }}</span>
				<span v-else-if="page === 2"><i class="ti ti-mood-smile"></i> {{ i18n.ts._initialTutorial._reaction.title }}</span>
				<span v-else-if="page === 3"><i class="ti ti-home"></i> {{ i18n.ts._initialTutorial._timeline.title }}</span>
				<span v-else-if="page === 4"><i class="ti ti-user-plus"></i> {{ i18n.ts.follow }}</span>
				<span v-else-if="page === 5"><i class="ti ti-pencil-plus"></i> {{ i18n.ts._initialTutorial._postNote.title }}</span>
				<span v-else-if="page === 6"><i class="ti ti-eye-exclamation"></i> {{ i18n.ts._initialTutorial._howToMakeAttachmentsSensitive.title }}</span>
				<span v-else-if="page === 7"><i class="ti ti-lock"></i> {{ i18n.ts.privacy }}</span>
				<span v-else-if="page === MAX_PAGE"><!-- なんもなし --></span>
				<span v-else>{{ i18n.ts._initialTutorial.title }}</span>
			</div>
			<div v-if="instance.canSkipInitialTutorial" :class="$style.closeButton">
				<button class="_button" data-cy-user-setup-close @click="cancel"><i class="ti ti-x"></i></button>
			</div>
		</div>
		<MkTutorial
			:class="$style.tutorialRoot"
			:showProgressbar="true"
			:skippable="false"
			:withSetup="true"
			@pageChanged="pageChangeHandler"
		>
			<template #welcome="{ next }">
				<!-- Tips for large-scale server admins: you should customize this slide for better branding -->
				<!-- 大規模サーバーの管理者さんへ: このスライドの内容をサーバー独自でアレンジすると良さそうなのでやってみてね -->
				<div ref="welcomePageRootEl" :class="$style.welcomePageRoot">
					<canvas ref="confettiEl" :class="$style.welcomePageConfetti"></canvas>
					<div
						:class="[
							$style.centerPage,
							$style.welcomePageMain,
							{
								[$style.appear]: animationPhase >= 3,
								[$style.done]: animationPhase === 4,
							}
						]"
					>
						<MkSpacer :marginMin="20" :marginMax="28">
							<div class="_gaps" style="word-break: auto-phrase; text-align: center;">
								<img ref="instanceIconEl" :src="instance.iconUrl || '/favicon.ico'" alt="" :class="$style.instanceIcon"/>
								<div>
									<div style="font-size: 135%;">{{ i18n.ts._initialTutorial._onboardingLanding.accountCreated }}</div>
									<div>{{ i18n.tsx._initialTutorial._onboardingLanding.welcomeToX({ name: instance.name ?? host }) }}</div>
								</div>
								<div>{{ i18n.tsx._initialTutorial._onboardingLanding.description({ name: instance.name ?? host }) }}</div>
								<MkButton large primary rounded gradate style="margin: 16px auto 0;" data-cy-user-setup-continue @click="next">{{ i18n.ts.start }} <i class="ti ti-arrow-right"></i></MkButton>
								<MkButton v-if="instance.canSkipInitialTutorial" transparent rounded style="margin: 0 auto;" data-cy-user-setup-close @click="cancel">{{ i18n.ts.later }}</MkButton>
								<MkInfo v-else warn style="width: fit-content; margin: 0 auto; text-align: start; white-space: pre-wrap;">{{ i18n.ts._initialTutorial._onboardingLanding.adminForcesToTakeTutorial }}</MkInfo>
								<MkInfo style="width: fit-content; margin: 0 auto; text-align: start; white-space: pre-wrap;">{{ i18n.tsx._initialTutorial._onboardingLanding.takesAbout({ min: 3 }) }}</MkInfo>
							</div>
						</MkSpacer>
					</div>
					<div
						:class="[
							$style.welcomePageAnimRoot,
							{
								[$style.appear]: animationPhase === 2,
								[$style.move]: animationPhase === 3,
							},
						]"
					>
						<img :src="instance.iconUrl || '/favicon.ico'" alt="" :class="$style.instanceIcon"/>
					</div>
				</div>
			</template>
			<template #finish="{ prev }">
				<div :class="$style.centerPage">
					<MkSpacer :marginMin="20" :marginMax="28">
						<div class="_gaps">
							<i class="ti ti-check" style="display: block; margin: auto; font-size: 3em; color: var(--accent);"></i>
							<div style="text-align: center; font-size: 120%;">{{ i18n.ts._initialTutorial._done.title }}</div>
							<div style="text-align: center;">{{ i18n.tsx._initialTutorial._onboardingDone.description({ name: instance.name ?? host }) }}</div>
							<div>
								<FormLink v-if="originalPath && originalPath !== '/'" :to="originalPath" large :behavior="'browser'">
									<template #icon><i class="ti ti-directions"></i></template>
									{{ i18n.ts._initialTutorial._onboardingDone.backToOriginalPath }}
									<template #caption>{{ i18n.ts._initialTutorial._onboardingDone.backToOriginalPathDescription }}</template>
								</FormLink>
								<hr v-if="originalPath && originalPath !== '/'">
								<div class="_gaps_s">
									<FormLink to="/settings/profile" large :behavior="'browser'">
										<template #icon><i class="ti ti-user"></i></template>
										{{ i18n.ts._initialTutorial._onboardingDone.profile }}
										<template #caption>{{ i18n.ts._initialTutorial._onboardingDone.profileDescription }}</template>
									</FormLink>
									<FormLink to="/explore" large :behavior="'browser'">
										<template #icon><i class="ti ti-hash"></i></template>
										{{ i18n.ts.explore }}
										<template #caption>{{ i18n.ts._initialTutorial._onboardingDone.exploreDescription }}</template>
									</FormLink>
									<FormLink to="/" large :behavior="'browser'" data-cy-user-setup-complete>
										<template #icon><i class="ti ti-home"></i></template>
										{{ i18n.ts._initialTutorial._onboardingDone.goToTimeline }}
										<template #caption>{{ i18n.ts._initialTutorial._onboardingDone.goToTimelineDescription }}</template>
									</FormLink>
								</div>
							</div>
							<MkInfo style="border-radius: 6px;">{{ i18n.ts._initialTutorial._done.youCanReferTutorialBy }}</MkInfo>
							<div style="text-align: center;">{{ i18n.tsx._initialTutorial._done.haveFun({ name: instance.name ?? host }) }}</div>
						</div>
					</MkSpacer>
				</div>
			</template>
		</MkTutorial>
	</div>
</div>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, onMounted } from 'vue';
import { create as createConfetti } from 'canvas-confetti';

import { definePageMetadata } from '@/scripts/page-metadata.js';
import { reactionPicker } from '@/scripts/reaction-picker.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { host } from '@/config.js';
import { confirm as osConfirm } from '@/os.js';

import MkAnimBg from '@/components/MkAnimBg.vue';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkTutorial, { MAX_PAGE } from '@/components/MkTutorial.vue';

import FormLink from '@/components/form/link.vue';

const page = ref(0);

function pageChangeHandler(to: number) {
	page.value = to;
}

// See: @/_boot_/common.ts L123 for details
const query = new URLSearchParams(location.search);
const originalPath = query.get('redirected_from');

async function cancel() {
	const confirm = await osConfirm({
		type: 'question',
		title: i18n.ts._initialTutorial.skipAreYouSure,
		text: i18n.ts._initialTutorial._done.youCanReferTutorialBy,
		okText: i18n.ts.yes,
		cancelText: i18n.ts.no,
	});

	if (confirm.canceled) return;

	location.href = '/';
}

// #region デフォルトオープニング画面のアニメーション
const confettiEl = shallowRef<HTMLCanvasElement | null>(null);
const welcomePageRootEl = shallowRef<HTMLDivElement | null>(null);
const instanceIconEl = shallowRef<HTMLImageElement | null>(null);
const instanceIconY = ref(0);
// 30pxは文字が上がってくる距離、40pxは上部ヘッダの高さ
const instanceIconYPx = computed(() => `${instanceIconY.value - 30 + 40}px`);

/**
 * 0 … なにもしない
 * 1 … 背景表示（mounted）
 * 2 … サーバーロゴ出現
 * 3 … サーバーロゴ移動・文字表示
 * 4 … 完了（オープニング用ロゴ消滅）
 */
const animationPhase = ref(0);

// 画面上部に表示されるアイコンの中心Y座標を取得
function getIconY(instanceIconEl: HTMLImageElement, welcomePageRootEl: HTMLDivElement) {
	const instanceIconElRect = instanceIconEl.getBoundingClientRect();
	return instanceIconElRect.top - welcomePageRootEl.getBoundingClientRect().top;
}

function instanceIconElImageLoaded() {
	return new Promise<void>((resolve) => {
		if (instanceIconEl.value!.complete) {
			resolve();
		} else {
			instanceIconEl.value!.addEventListener('load', () => resolve(), { once: true });
		}
	});
}

onMounted(() => {
	const confetti = createConfetti(confettiEl.value!, {
		resize: true,
	});

	instanceIconY.value = getIconY(instanceIconEl.value!, welcomePageRootEl.value!);
	window.addEventListener('resize', () => {
		instanceIconY.value = getIconY(instanceIconEl.value!, welcomePageRootEl.value!);
	}, { passive: true });

	// チュートリアル内で必須（subBootでは初期化されないので）
	Promise.all([
		reactionPicker.init(),
		instanceIconElImageLoaded(),
	]).then(() => {
		setTimeout(() => {
			// 待たないとアニメーションが正しく動かない場合がある
			animationPhase.value = 1;

			setTimeout(() => {
				animationPhase.value = 2;

				setTimeout(() => {
					animationPhase.value = 3;

					setTimeout(() => {
						animationPhase.value = 4;
						confetti({
							spread: 70,
							origin: { y: 0.5 },
						});
					}, 1000);
				}, 1250);
			}, 500);
		}, 100);
	});
});

// #endregion

definePageMetadata(() => ({
	title: 'Onboarding',
	description: 'Welcome to Misskey!',
}));
</script>

<style lang="scss" module>
.onboardingRoot {
	box-sizing: border-box;
	display: grid;
	place-content: center;
	min-height: 100svh;
	padding: 32px 32px 64px 32px;
}

.onboardingBg {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	opacity: 0;
	transition: opacity 2s ease;
}

.onboardingContainer {
	position: relative;
	border-radius: var(--radius);
	background-color: var(--acrylicPanel);
	overflow: clip;
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	max-width: 650px;
	max-height: 700px;
	width: 100vw;
	height: 100svh;

	container-type: inline-size;
}

.tutorialTitle {
	position: absolute;
	box-sizing: border-box;
	top: 0;
	left: 0;
	width: 100%;
	font-size: 14px;
	line-height: 40px;
	height: 40px;
	padding: 0 var(--margin);
	background: var(--panelHighlight);
	display: flex;
	transition: transform 0.5s ease;
	transform: translateY(-100%);

	&.showing {
		transform: translateY(0);
	}

	.text {
		font-weight: 700;
	}

	.closeButton {
		margin-left: auto;

		>._button {
			padding: 8px;
		}
	}
}

.tutorialRoot {
	margin-top: 40px;
	height: calc(100% - 40px);
}

.ready {
	& .onboardingBg {
		opacity: 1;
	}
}

.centerPage {
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 100%;
	box-sizing: border-box;
	overflow-y: auto;
}

.welcomePageRoot {
	position: relative;
	height: 100%;
}

.welcomePageMain {
	opacity: 0;
	transform: translateY(30px);
	visibility: hidden;

	.instanceIcon {
		opacity: 0;
	}

	&.appear {
		transition: opacity 0.75s 0.25s ease, transform 0.75s 0.25s ease;
		opacity: 1;
		transform: translateY(0);
		visibility: visible;
	}

	&.done .instanceIcon {
		opacity: 1;
	}
}

.instanceIcon {
	height: 5em;
	width: 5em;
	margin: 0 auto;
	object-fit: contain;
	border-radius: calc(var(--radius) / 2);
}

.welcomePageConfetti,
.welcomePageAnimRoot {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	overflow: clip;
	pointer-events: none;

	.instanceIcon {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		opacity: 0;
	}

	&.appear {
		.instanceIcon {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1.5);
			transition: opacity 1s cubic-bezier(0.22, 0.61, 0.36, 1), transform 1s cubic-bezier(0.22, 0.61, 0.36, 1);
		}
	}

	&.move {
		.instanceIcon {
			opacity: 1;
			transform: translate(-50%, 0) scale(1);
			top: v-bind(instanceIconYPx);
			transition: transform 1s ease, top 1s ease;
		}
	}
}
</style>
