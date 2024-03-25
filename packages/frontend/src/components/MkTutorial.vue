<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.tutorialRoot">
	<div v-if="showProgressbar" :class="$style.progressBar">
		<div :class="$style.progressBarValue" :style="{ width: `${(page / MAX_PAGE) * 100}%` }"></div>
	</div>
	<div v-if="showProgressbar && page !== 0 && page !== MAX_PAGE" :class="$style.progressText">{{ page }}/{{ MAX_PAGE - 1 }}</div>
	<div :class="$style.tutorialMain">
		<Transition
			mode="out-in"
			:enterActiveClass="$style.transition_x_enterActive"
			:leaveActiveClass="$style.transition_x_leaveActive"
			:enterFromClass="$style.transition_x_enterFrom"
			:leaveToClass="$style.transition_x_leaveTo"
		>
			<slot v-if="page === 0" key="tutorialPage_0" name="welcome" :close="() => emit('close', true)" :next="next">
				<div :class="$style.centerPage">
					<MkAnimBg style="position: absolute; top: 0;" :scale="1.5"/>
					<MkSpacer :marginMin="20" :marginMax="28">
						<div class="_gaps" style="text-align: center;">
							<i class="ti ti-confetti" style="display: block; margin: auto; font-size: 3em; color: var(--accent);"></i>
							<div style="font-size: 120%;">{{ i18n.ts._initialTutorial._landing.title }}</div>
							<div>{{ i18n.ts._initialTutorial._landing.description }}</div>
							<MkButton primary rounded gradate style="margin: 16px auto 0 auto;" data-cy-user-setup-continue @click="next">{{ i18n.ts._initialTutorial.launchTutorial }} <i class="ti ti-arrow-right"></i></MkButton>
							<MkButton v-if="skippable" style="margin: 0 auto;" transparent rounded data-cy-user-setup-close @click="emit('close', true)">{{ i18n.ts.close }}</MkButton>
						</div>
					</MkSpacer>
				</div>
			</slot>
			<div v-else-if="page === 1" key="tutorialPage_1" :class="$style.pageContainer">
				<div :class="$style.pageRoot">
					<MkSpacer :marginMin="20" :marginMax="28" :class="$style.pageMain">
						<XNote phase="aboutNote"/>
					</MkSpacer>
				</div>
			</div>
			<div v-else-if="page === 2" key="tutorialPage_2" :class="$style.pageContainer">
				<div :class="$style.pageRoot">
					<MkSpacer :marginMin="20" :marginMax="28" :class="$style.pageMain">
						<div class="_gaps">
							<XNote phase="howToReact" @reacted="isReactionTutorialPushed = true"/>
							<b v-if="!isReactionTutorialPushed" :class="$style.actionWaitText">{{ i18n.ts._initialTutorial._reaction.reactToContinue }}</b>
						</div>
					</MkSpacer>
				</div>
			</div>
			<div v-else-if="page === 3" key="tutorialPage_3" :class="$style.pageContainer">
				<div :class="$style.pageRoot">
					<MkSpacer :marginMin="20" :marginMax="28" :class="$style.pageMain">
						<XTimeline/>
					</MkSpacer>
				</div>
			</div>
			<div v-else-if="page === 4" key="tutorialPage_4" :class="$style.pageContainer">
				<div :class="$style.pageRoot">
					<MkSpacer :marginMin="20" :marginMax="28" :class="$style.pageMain">
						<XFollowUsers/>
					</MkSpacer>
				</div>
			</div>
			<div v-else-if="page === 5" key="tutorialPage_5" :class="$style.pageContainer">
				<div :class="$style.pageRoot">
					<MkSpacer :marginMin="20" :marginMax="28" :class="$style.pageMain">
						<XPostNote/>
					</MkSpacer>
				</div>
			</div>
			<div v-else-if="page === 6" key="tutorialPage_6" :class="$style.pageContainer">
				<div :class="$style.pageRoot">
					<MkSpacer :marginMin="20" :marginMax="28" :class="$style.pageMain">
						<div class="_gaps">
							<XSensitive @succeeded="isSensitiveTutorialSucceeded = true"/>
							<b v-if="!isSensitiveTutorialSucceeded" :class="$style.actionWaitText">{{ i18n.ts._initialTutorial._howToMakeAttachmentsSensitive.doItToContinue }}</b>
						</div>
					</MkSpacer>
				</div>
			</div>
			<div v-else-if="page === 7" key="tutorialPage_7" :class="$style.pageContainer">
				<div :class="$style.pageRoot">
					<MkSpacer :marginMin="20" :marginMax="28" :class="$style.pageMain">
						<div class="_gaps">
							<XPrivacySettings/>
						</div>
					</MkSpacer>
				</div>
			</div>
			<slot v-else-if="page === 8" key="tutorialPage_8" name="finish" :close="() => emit('close')" :prev="prev">
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
								<MkButton v-if="initialPage !== 4" rounded @click="prev"><i class="ti ti-arrow-left"></i> {{ i18n.ts.goBack }}</MkButton>
								<MkButton rounded primary gradate @click="emit('close')">{{ i18n.ts.close }}</MkButton>
							</div>
						</div>
					</MkSpacer>
				</div>
			</slot>
		</Transition>
	</div>
	<div :class="[$style.pageFooter, { [$style.pageFooterShown]: (page > 0 && page < MAX_PAGE) }]">
		<div class="_buttonsCenter">
			<MkButton v-if="initialPage !== page" rounded @click="prev"><i class="ti ti-arrow-left"></i> {{ i18n.ts.goBack }}</MkButton>
			<MkButton primary rounded gradate :disabled="!canContinue" data-cy-user-setup-continue @click="next">{{ i18n.ts.continue }} <i class="ti ti-arrow-right"></i></MkButton>
		</div>
	</div>
</div>
</template>

<script lang="ts">

// チュートリアルの枚数を増やしたら必ず変更すること！！
export const MAX_PAGE = 8;

</script>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import MkButton from '@/components/MkButton.vue';
import XNote from '@/components/MkTutorial.Note.vue';
import XTimeline from '@/components/MkTutorial.Timeline.vue';
import XFollowUsers from '@/components/MkTutorial.FollowUsers.vue';
import XPostNote from '@/components/MkTutorial.PostNote.vue';
import XSensitive from '@/components/MkTutorial.Sensitive.vue';
import XPrivacySettings from '@/components/MkTutorial.PrivacySettings.vue';
import MkAnimBg from '@/components/MkAnimBg.vue';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { host } from '@/config.js';
import { claimAchievement } from '@/scripts/achievements.js';

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
const isTest = (import.meta.env.MODE === 'test');

// eslint-disable-next-line vue/no-setup-props-destructure
const page = ref(props.initialPage ?? 0);

watch(page, (to) => {
	if (to === MAX_PAGE) {
		claimAchievement('tutorialCompleted');
	}
});

const isReactionTutorialPushed = ref<boolean>(isTest);
const isSensitiveTutorialSucceeded = ref<boolean>(isTest);

const canContinue = computed(() => {
	if (page.value === 2) {
		return isReactionTutorialPushed.value;
	} else if (page.value === 6) {
		return isSensitiveTutorialSucceeded.value;
	} else {
		return true;
	}
});

function next() {
	if (page.value === 3 && !props.withSetup) {
		page.value += 2;
	} else if (page.value === 6 && !props.withSetup) {
		page.value += 2;
	} else {
		page.value++;
	}

	emit('pageChanged', page.value);
}

function prev() {
	if (page.value === 5 && !props.withSetup) {
		page.value -= 2;
	} else if (page.value === 8 && !props.withSetup) {
		page.value -= 2;
	} else {
		page.value--;
	}

	emit('pageChanged', page.value);
}
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

.actionWaitText {
	color: var(--error);
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
