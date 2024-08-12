<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.tutorialRoot">
	<div v-if="showProgressbar" :class="$style.progressBar">
		<div :class="$style.progressBarValue" :style="{ width: `${(page / MAX_PAGE) * 100}%` }"></div>
	</div>
	<div v-if="showProgressbar && page !== 0 && page !== MAX_PAGE" :class="$style.progressText">{{ page }}/{{ MAX_PAGE }}</div>
	<div :class="$style.tutorialMain">
		<Transition
			mode="out-in"
			:enterActiveClass="$style.transition_x_enterActive"
			:leaveActiveClass="$style.transition_x_leaveActive"
			:enterFromClass="$style.transition_x_enterFrom"
			:leaveToClass="$style.transition_x_leaveTo"

			@beforeLeave="areButtonsLocked = true"
			@afterEnter="areButtonsLocked = false"
		>
			<slot v-if="page === 0" key="tutorialPage_0" name="welcome" :close="() => emit('close', true)" :next="next">
				<div :class="$style.centerPage">
					<MkAnimBg style="position: absolute; top: 0;" :scale="1.5"/>
					<MkSpacer :marginMin="20" :marginMax="28">
						<div class="_gaps" style="text-align: center;">
							<i class="ti ti-confetti" style="display: block; margin: auto; font-size: 3em; color: var(--accent);"></i>
							<div style="font-size: 120%;">{{ i18n.ts._initialTutorial._landing.title }}</div>
							<div>{{ i18n.ts._initialTutorial._landing.description }}</div>
							<MkButton primary rounded gradate style="margin: 16px auto 0 auto;" data-cy-user-setup-start @click="next">{{ i18n.ts._initialTutorial.launchTutorial }} <i class="ti ti-arrow-right"></i></MkButton>
							<MkButton v-if="skippable" style="margin: 0 auto;" transparent rounded data-cy-user-setup-close @click="emit('close', true)">{{ i18n.ts.close }}</MkButton>
						</div>
					</MkSpacer>
				</div>
			</slot>
			<slot v-else-if="page === MAX_PAGE" :key="`tutorialPage_${MAX_PAGE}`" name="finish" :close="() => emit('close')" :prev="prev">
				<div :class="$style.centerPage">
					<MkAnimBg style="position: absolute; top: 0;" :scale="1.5"/>
					<MkSpacer :marginMin="20" :marginMax="28">
						<div class="_gaps">
							<i class="ti ti-check" style="display: block; margin: auto; font-size: 3em; color: var(--accent);"></i>
							<div style="text-align: center; font-size: 120%;">{{ i18n.ts._initialTutorial._done.title }}</div>
							<I18n :src="i18n.ts._initialTutorial._done.description" tag="div" style="text-align: center; padding: 0 16px;">
								<template #link>
									<a href="https://misskey-hub.net/docs/for-users/" target="_blank" class="_link">{{ i18n.ts.help }}</a>
								</template>
							</I18n>
							<div style="text-align: center;">{{ i18n.ts._initialTutorial._done.youCanReferTutorialBy }}</div>
							<div style="text-align: center;">{{ i18n.tsx._initialTutorial._done.haveFun({ name: instance.name ?? host }) }}</div>
							<div class="_buttonsCenter" style="margin-top: 16px;">
								<MkButton rounded @click="prev"><i class="ti ti-arrow-left"></i> {{ i18n.ts.goBack }}</MkButton>
								<MkButton rounded primary gradate @click="emit('close')">{{ i18n.ts.close }}</MkButton>
							</div>
						</div>
					</MkSpacer>
				</div>
			</slot>
			<div v-else :key="`tutorialPage_${page}`" :class="$style.pageContainer">
				<div :class="$style.pageRoot">
					<MkSpacer :marginMin="20" :marginMax="28" :class="$style.pageMain">
						<component
							:is="componentsDef[page - 1].component"
							ref="tutorialPageEl"
							v-bind="componentsDef[page - 1].props"
						/>
					</MkSpacer>
				</div>
			</div>
		</Transition>
	</div>
	<div :class="[$style.pageFooter, { [$style.pageFooterShown]: (page > 0 && page < MAX_PAGE) }]" :inert="(page <= 0 && page >= MAX_PAGE)">
		<div class="_buttonsCenter">
			<MkButton v-if="initialPage !== page" :disabled="areButtonsLocked" rounded @click="prev"><i class="ti ti-arrow-left"></i> {{ i18n.ts.goBack }}</MkButton>
			<MkButton primary rounded gradate :disabled="!canContinue" data-cy-user-setup-next @click="next">{{ i18n.ts.continue }} <i class="ti ti-arrow-right"></i></MkButton>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import type { Ref } from 'vue';
import { i18n } from '@/i18n.js';

/**
 * 【ページの足し方】
 *
 * 1. ページコンポーネントを作成
 *    このとき、TutorialPageCommonExposeを実装すること
 *    （canContinueを変化させることで、次へボタンが押されるのをブロックできます。ギミックがないページはtrueでOK。）
 * 2. tutorialBodyPagesDefにページのアイコン・タイトル・区分を追加
 *    （区分がsetupの場合はwithSetup == falseのときにスキップされます）
 * 3. componentsDefにページのコンポーネントを追加（順番を対応させること）
 */

/** チュートリアルページ用Expose */
export type TutorialPageCommonExpose = {
	canContinue: boolean | Ref<boolean>;
};

/** ページ メタデータ */
export type TutorialPage = {
	icon?: string;
	type: 'tutorial' | 'setup';
	title: string;
};

/**
 * はじめと終わり以外のページ メタデータ
 *
 * （コンポーネントはsetup内で定義しています）
 */
export const tutorialBodyPagesDef = [{
	icon: 'ti ti-user',
	type: 'setup',
	title: i18n.ts._initialTutorial._profileSettings.title,
}, {
	icon: 'ti ti-pencil',
	type: 'tutorial',
	title: i18n.ts._initialTutorial._note.title,
}, {
	icon: 'ti ti-mood-smile',
	type: 'tutorial',
	title: i18n.ts._initialTutorial._reaction.title,
}, {
	icon: 'ti ti-home',
	type: 'tutorial',
	title: i18n.ts._initialTutorial._timeline.title,
}, {
	icon: 'ti ti-user-add',
	type: 'setup',
	title: i18n.ts.follow,
}, {
	icon: 'ti ti-pencil-plus',
	type: 'tutorial',
	title: i18n.ts._initialTutorial._postNote.title,
}, {
	icon: 'ti ti-eye-exclamation',
	type: 'tutorial',
	title: i18n.ts._initialTutorial._howToMakeAttachmentsSensitive.title,
}, {
	icon: 'ti ti-lock',
	type: 'setup',
	title: i18n.ts._initialTutorial._privacySettings.title,
}] as const satisfies TutorialPage[];

export const MAX_PAGE = tutorialBodyPagesDef.length + 1; // 0始まりにするために +2 - 1 = +1
</script>

<script lang="ts" setup>
import { ref, shallowRef, isRef, computed, watch } from 'vue';
import MkButton from '@/components/MkButton.vue';
import XProfileSettings from '@/components/MkTutorial.ProfileSettings.vue';
import XNote from '@/components/MkTutorial.Note.vue';
import XTimeline from '@/components/MkTutorial.Timeline.vue';
import XFollowUsers from '@/components/MkTutorial.FollowUsers.vue';
import XPostNote from '@/components/MkTutorial.PostNote.vue';
import XSensitive from '@/components/MkTutorial.Sensitive.vue';
import XPrivacySettings from '@/components/MkTutorial.PrivacySettings.vue';
import MkAnimBg from '@/components/MkAnimBg.vue';
import { instance } from '@/instance.js';
import { host } from '@/config.js';
import { claimAchievement } from '@/scripts/achievements.js';

import type { Component } from 'vue';
import type { Tuple } from '@/type.js';

const props = defineProps<{
	initialPage?: number;
	showProgressbar?: boolean;
	skippable?: boolean;
	withSetup?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'pageChanged', to: number): void;
	(ev: 'close', withConfirm?: boolean): void;
}>();

// テストの場合は全インタラクションをスキップする
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const isTest = (import.meta.env.MODE === 'test' || window.Cypress != null);

type ComponentDef = {
	component: Component;
	props?: Record<string, unknown>;
};

/**
 * はじめと終わり以外のページ コンポーネント
 *
 * （メタデータは上の方で定義しています）
 */
const componentsDef: Tuple<ComponentDef, typeof tutorialBodyPagesDef.length> = [
	{ component: XProfileSettings },
	{ component: XNote, props: { phase: 'aboutNote' } },
	{ component: XNote, props: { phase: 'howToReact' } },
	{ component: XTimeline },
	{ component: XFollowUsers },
	{ component: XPostNote },
	{ component: XSensitive },
	{ component: XPrivacySettings },
] as const satisfies ComponentDef[];

// eslint-disable-next-line vue/no-setup-props-destructure
const page = ref(props.initialPage ?? 0);

const currentPageDef = computed(() => {
	if (page.value > 0 && page.value < MAX_PAGE - 1) {
		return tutorialBodyPagesDef[page.value - 1];
	} else {
		return null;
	}
});

watch(page, (to) => {
	if (to === MAX_PAGE) {
		claimAchievement('tutorialCompleted');
	}
});

// ページコンポーネントのexposeを受け取る
const tutorialPageEl = shallowRef<TutorialPageCommonExpose | null>(null);

// トランジション中に連打されて進んじゃうのを防ぐ
const areButtonsLocked = ref(false);

const canContinue = computed(() => {
	if (isTest) {
		return true;
	}

	if (areButtonsLocked.value) {
		return false;
	}

	if (tutorialPageEl.value) {
		if (isRef(tutorialPageEl.value.canContinue)) {
			return tutorialPageEl.value.canContinue.value;
		} else {
			return tutorialPageEl.value.canContinue;
		}
	} else {
		return true;
	}
});

function next() {
	if (areButtonsLocked.value) {
		return;
	} else {
		areButtonsLocked.value = true;
	}

	const bodyPagesDefIndex = page.value - 1;

	if (!props.withSetup && tutorialBodyPagesDef[bodyPagesDefIndex + 1].type === 'setup') {
		function findNextTutorialPage() {
			for (let i = bodyPagesDefIndex + 1; i < tutorialBodyPagesDef.length; i++) {
				if (tutorialBodyPagesDef[i] == null) {
					break;
				}

				if (tutorialBodyPagesDef[i].type === 'tutorial') {
					return i + 1; // はじめの1ページ分足す
				}
			}

			return MAX_PAGE;
		}

		page.value = findNextTutorialPage();
	} else {
		page.value = Math.min(page.value + 1, MAX_PAGE);
	}

	emit('pageChanged', page.value);
}

function prev() {
	if (areButtonsLocked.value) {
		return;
	} else {
		areButtonsLocked.value = true;
	}

	const bodyPagesDefIndex = page.value - 1;

	if (!props.withSetup && tutorialBodyPagesDef[bodyPagesDefIndex - 1].type === 'setup') {
		function findPrevTutorialPage() {
			for (let i = bodyPagesDefIndex - 1; i >= 0; i--) {
				if (tutorialBodyPagesDef[i] == null) {
					break;
				}

				if (tutorialBodyPagesDef[i].type === 'tutorial') {
					return i + 1; // はじめの1ページ分足す
				}
			}

			return 0;
		}

		page.value = findPrevTutorialPage();
	} else {
		page.value = Math.max(page.value - 1, 0);
	}

	emit('pageChanged', page.value);
}

defineExpose({
	page,
	currentPageDef,
});
</script>

<style lang="scss" module>
.tutorialRoot {
	position: relative;
	box-sizing: border-box;
	overflow: hidden;
	width: 100%;
	height: 100%;
}

.tutorialMain {
	position: relative;
	width: 100%;
	height: 100%;
}

.progressBar {
	position: absolute;
	top: 0;
	left: 0;
	z-index: 10;
	width: 100%;
	height: 4px;
}

.progressBarValue {
	height: 100%;
	background: linear-gradient(90deg, var(--buttonGradateA), var(--buttonGradateB));
	transition: all 0.5s cubic-bezier(0,.5,.5,1);
}

.progressText {
	position: absolute;
	top: 1em;
	right: 1em;
	font-size: 0.8em;
	opacity: 0.7;
	pointer-events: none;
}

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

.progressBar {
	position: absolute;
	top: 0;
	left: 0;
	z-index: 10;
	width: 100%;
	height: 4px;
}

.progressBarValue {
	height: 100%;
	background: linear-gradient(90deg, var(--buttonGradateA), var(--buttonGradateB));
	transition: all 0.5s cubic-bezier(0,.5,.5,1);
}

.centerPage {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100%;
	box-sizing: border-box;
}

.pageContainer {
	width: 100%;
	height: 100%;
	overflow-x: hidden;
	overflow-y: auto;
}

.pageRoot {
	display: flex;
	flex-direction: column;
	min-height: 100%;
}

.pageMain {
	flex-grow: 1;
	line-height: 1.5;
	margin-bottom: 56px;
}

.pageFooter {
	position: sticky;
	bottom: 0;
	left: 0;
	width: 100%;
	height: 56px;
	box-sizing: border-box;
	flex-shrink: 0;
	padding: 12px;
	border-top: solid 0.5px var(--divider);
	background: var(--acrylicBg);

	transition: transform 0.3s cubic-bezier(0,0,.35,1);
	transform: translateY(100%);
	visibility: hidden;

	&.pageFooterShown {
		transform: translateY(0);
		visibility: visible;
	}
}
</style>
