<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition
	:enterActiveClass="$style.transition_zoom_enterActive"
	:leaveActiveClass="$style.transition_zoom_leaveActive"
	:enterFromClass="$style.transition_zoom_enterFrom"
	:leaveToClass="$style.transition_zoom_leaveTo"
	:moveClass="$style.transition_zoom_move"
	mode="out-in"
>
	<MkSpacer v-if="!gameStarted" :contentMax="800">
		<div :class="$style.root">
			<div class="_gaps">
				<div :class="$style.frame" style="text-align: center;">
					<div :class="$style.frameInner">
						<img src="/client-assets/drop-and-fusion/logo.png" style="display: block; max-width: 100%; max-height: 200px; margin: auto;"/>
					</div>
				</div>
				<div :class="$style.frame" style="text-align: center;">
					<div :class="$style.frameInner">
						<div class="_gaps" style="padding: 16px;">
							<MkSelect v-model="gameMode">
								<option value="normal">NORMAL</option>
								<option value="square">SQUARE</option>
								<option value="yen">YEN</option>
								<option value="sweets">SWEETS</option>
								<!--<option value="space">SPACE</option>-->
							</MkSelect>
							<MkButton primary gradate large rounded inline @click="start">{{ i18n.ts.start }}</MkButton>
						</div>
					</div>
					<div :class="$style.frameInner">
						<div class="_gaps" style="padding: 16px;">
							<div style="font-size: 90%;"><i class="ti ti-music"></i> {{ i18n.ts.soundWillBePlayed }}</div>
							<MkSwitch v-model="mute">
								<template #label>{{ i18n.ts.mute }}</template>
							</MkSwitch>
						</div>
					</div>
				</div>
				<div :class="$style.frame">
					<div :class="$style.frameInner">
						<div class="_gaps_s" style="padding: 16px;">
							<div><b>{{ i18n.tsx.lastNDays({ n: 7 }) }} {{ i18n.ts.ranking }}</b> ({{ gameMode }})</div>
							<div v-if="ranking" class="_gaps_s">
								<div v-for="r in ranking" :key="r.id" :class="$style.rankingRecord">
									<MkAvatar :link="true" style="width: 24px; height: 24px; margin-right: 4px;" :user="r.user"/>
									<MkUserName :user="r.user" :nowrap="true"/>
									<b style="margin-left: auto;">{{ r.score.toLocaleString() }} {{ getScoreUnit(gameMode) }}</b>
								</div>
							</div>
							<div v-else>{{ i18n.ts.loading }}</div>
						</div>
					</div>
				</div>
				<div :class="$style.frame">
					<div :class="$style.frameInner" style="padding: 16px;">
						<div style="font-weight: bold;">{{ i18n.ts._bubbleGame.howToPlay }}</div>
						<ol>
							<li>{{ i18n.ts._bubbleGame._howToPlay.section1 }}</li>
							<li>{{ i18n.ts._bubbleGame._howToPlay.section2 }}</li>
							<li>{{ i18n.ts._bubbleGame._howToPlay.section3 }}</li>
						</ol>
					</div>
				</div>
				<div :class="$style.frame">
					<div :class="$style.frameInner">
						<div class="_gaps_s" style="padding: 16px;">
							<div><b>Credit</b></div>
							<div>
								<div>Ai-chan illustration: @poteriri@misskey.io</div>
								<div>BGM: @ys@misskey.design</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</MkSpacer>
	<XGame v-else :gameMode="gameMode" :mute="mute" @end="onGameEnd"/>
</Transition>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import XGame from './drop-and-fusion.game.vue';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import MkSelect from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { misskeyApiGet } from '@/scripts/misskey-api.js';

const gameMode = ref<'normal' | 'square' | 'yen' | 'sweets' | 'space'>('normal');
const gameStarted = ref(false);
const mute = ref(false);
const ranking = ref(null);

watch(gameMode, async () => {
	ranking.value = await misskeyApiGet('bubble-game/ranking', { gameMode: gameMode.value });
}, { immediate: true });

function getScoreUnit(gameMode: string) {
	return gameMode === 'normal' ? 'pt' :
		gameMode === 'square' ? 'pt' :
		gameMode === 'yen' ? '円' :
		gameMode === 'sweets' ? 'kcal' :
		gameMode === 'space' ? 'pt' :
		'' as never;
}

async function start() {
	gameStarted.value = true;
}

function onGameEnd() {
	gameStarted.value = false;
}

definePageMetadata(() => ({
	title: i18n.ts.bubbleGame,
	icon: 'ti ti-device-gamepad',
}));
</script>

<style lang="scss" module>
.transition_zoom_move,
.transition_zoom_enterActive,
.transition_zoom_leaveActive {
	transition: opacity 0.5s cubic-bezier(0,.5,.5,1), transform 0.5s cubic-bezier(0,.5,.5,1) !important;
}
.transition_zoom_enterFrom,
.transition_zoom_leaveTo {
	opacity: 0;
	transform: scale(0.8);
}

.root {
	margin: 0 auto;
	max-width: 600px;
	user-select: none;

	* {
		user-select: none;
	}
}

.frame {
	padding: 7px;
	background: #8C4F26;
	box-shadow: 0 6px 16px #0007, 0 0 1px 1px #693410, inset 0 0 2px 1px #ce8a5c;
	border-radius: 10px;
}

.frameH {
	display: flex;
	gap: 6px;
}

.frameInner {
	padding: 8px;
	margin-top: 8px;
	background: #F1E8DC;
	box-shadow: 0 0 2px 1px #ce8a5c, inset 0 0 1px 1px #693410;
	border-radius: 6px;
	color: #693410;

	&:first-child {
		margin-top: 0;
	}
}

.frameDivider {
	height: 0;
	border: none;
	border-top: 1px solid #693410;
	border-bottom: 1px solid #ce8a5c;
}

.rankingRecord {
	display: flex;
	line-height: 24px;
	padding-top: 4px;
	white-space: nowrap;
	overflow: visible;
	text-overflow: ellipsis;
}
</style>
