<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :contentMax="800">
		<div v-show="!gameStarted" :class="$style.root">
			<div style="text-align: center;" class="_gaps">
				<div :class="$style.frame">
					<div :class="$style.frameInner">
						<img src="/client-assets/drop-and-fusion/logo.png" style="display: block; max-width: 100%; max-height: 200px; margin: auto;"/>
					</div>
				</div>
				<div :class="$style.frame">
					<div :class="$style.frameInner">
						<div class="_gaps" style="padding: 16px;">
							<MkSelect v-model="gameMode">
								<option value="normal">NORMAL</option>
								<option value="square">SQUARE</option>
							</MkSelect>
							<MkButton primary gradate large rounded inline @click="start">{{ i18n.ts.start }}</MkButton>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div v-show="gameStarted" class="_gaps_s" :class="$style.root">
			<div style="display: flex;">
				<div :class="$style.frame" style="flex: 1; margin-right: 10px;">
					<div :class="$style.frameInner">
						<b>BUBBLE GAME</b>
						<div>- {{ gameMode }} -</div>
					</div>
				</div>
				<div :class="[$style.frame, $style.stock]" style="margin-left: auto;">
					<div :class="$style.frameInner" style="text-align: center;">
						NEXT >>>
						<TransitionGroup
							:enterActiveClass="$style.transition_stock_enterActive"
							:leaveActiveClass="$style.transition_stock_leaveActive"
							:enterFromClass="$style.transition_stock_enterFrom"
							:leaveToClass="$style.transition_stock_leaveTo"
							:moveClass="$style.transition_stock_move"
						>
							<div v-for="x in stock" :key="x.id" style="display: inline-block;">
								<img :src="game.getTextureImageUrl(x.mono)" style="width: 32px;"/>
							</div>
						</TransitionGroup>
					</div>
				</div>
			</div>
			<div :class="$style.main" @contextmenu.stop.prevent>
				<div ref="containerEl" :class="[$style.container, { [$style.gameOver]: gameOver }]" @click.stop.prevent="onClick" @touchmove.stop.prevent="onTouchmove" @touchend="onTouchend" @mousemove="onMousemove">
					<img v-if="defaultStore.state.darkMode" src="/client-assets/drop-and-fusion/frame-dark.svg" :class="$style.mainFrameImg"/>
					<img v-else src="/client-assets/drop-and-fusion/frame-light.svg" :class="$style.mainFrameImg"/>
					<canvas ref="canvasEl" :class="$style.canvas"/>
					<Transition
						:enterActiveClass="$style.transition_combo_enterActive"
						:leaveActiveClass="$style.transition_combo_leaveActive"
						:enterFromClass="$style.transition_combo_enterFrom"
						:leaveToClass="$style.transition_combo_leaveTo"
						:moveClass="$style.transition_combo_move"
					>
						<div v-show="combo > 1" :class="$style.combo" :style="{ fontSize: `${100 + ((comboPrev - 2) * 15)}%` }">{{ comboPrev }} Chain!</div>
					</Transition>
					<img v-if="currentPick" src="/client-assets/drop-and-fusion/dropper.png" :class="$style.dropper" :style="{ left: dropperX + 'px' }"/>
					<Transition
						:enterActiveClass="$style.transition_picked_enterActive"
						:leaveActiveClass="$style.transition_picked_leaveActive"
						:enterFromClass="$style.transition_picked_enterFrom"
						:leaveToClass="$style.transition_picked_leaveTo"
						:moveClass="$style.transition_picked_move"
						mode="out-in"
					>
						<img v-if="currentPick" :key="currentPick.id" :src="game.getTextureImageUrl(currentPick.mono)" :class="$style.currentMono" :style="{ top: -(currentPick?.mono.size / 2) + 'px', left: (dropperX - (currentPick?.mono.size / 2)) + 'px', width: `${currentPick?.mono.size}px` }"/>
					</Transition>
					<template v-if="dropReady && currentPick">
						<img src="/client-assets/drop-and-fusion/drop-arrow.svg" :class="$style.currentMonoArrow" :style="{ top: (currentPick.mono.size / 2) + 10 + 'px', left: (dropperX - 10) + 'px', width: `20px` }"/>
						<div :class="$style.dropGuide" :style="{ left: (dropperX - 2) + 'px' }"/>
					</template>
					<div v-if="gameOver" :class="$style.gameOverLabel">
						<div class="_gaps_s">
							<img src="/client-assets/drop-and-fusion/gameover.png" style="width: 200px; max-width: 100%; display: block; margin: auto; margin-bottom: -5px;"/>
							<div>SCORE: <MkNumber :value="score"/></div>
							<div>MAX CHAIN: <MkNumber :value="maxCombo"/></div>
							<div class="_buttonsCenter">
								<MkButton primary rounded @click="restart">Restart</MkButton>
								<MkButton primary rounded @click="share">Share</MkButton>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div style="display: flex;">
				<div :class="$style.frame" style="flex: 1; margin-right: 10px;">
					<div :class="$style.frameInner">
						<div>SCORE: <b><MkNumber :value="score"/></b> (MAX CHAIN: <b><MkNumber :value="maxCombo"/></b>)</div>
						<div>HIGH SCORE: <b v-if="highScore"><MkNumber :value="highScore"/></b><b v-else>-</b></div>
					</div>
				</div>
				<div :class="[$style.frame]" style="margin-left: auto;">
					<div :class="$style.frameInner" style="text-align: center;">
						<div @click="showConfig = !showConfig"><i class="ti ti-settings"></i></div>
					</div>
				</div>
			</div>
			<div v-if="showConfig" :class="$style.frame">
				<div :class="$style.frameInner">
					<MkRange v-model="bgmVolume" :min="0" :max="1" :step="0.0025" :textConverter="(v) => `${Math.floor(v * 100)}%`" :continuousUpdate="true">
						<template #label>BGM {{ i18n.ts.volume }}</template>
					</MkRange>
				</div>
			</div>
			<div v-if="showConfig" :class="$style.frame">
				<div :class="$style.frameInner">
					<div>Credit</div>
					<div>BGM: @ys@misskey.design</div>
				</div>
			</div>
			<div :class="$style.frame">
				<div :class="$style.frameInner">
					<MkButton @click="restart">Restart</MkButton>
				</div>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { onDeactivated, ref, shallowRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkRippleEffect from '@/components/MkRippleEffect.vue';
import * as os from '@/os.js';
import MkNumber from '@/components/MkNumber.vue';
import MkPlusOneEffect from '@/components/MkPlusOneEffect.vue';
import MkButton from '@/components/MkButton.vue';
import { claimAchievement } from '@/scripts/achievements.js';
import { defaultStore } from '@/store.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { useInterval } from '@/scripts/use-interval.js';
import MkSelect from '@/components/MkSelect.vue';
import { apiUrl } from '@/config.js';
import { $i } from '@/account.js';
import { DropAndFusionGame, Mono } from '@/scripts/drop-and-fusion-engine.js';
import * as sound from '@/scripts/sound.js';
import MkRange from '@/components/MkRange.vue';

const containerEl = shallowRef<HTMLElement>();
const canvasEl = shallowRef<HTMLCanvasElement>();
const dropperX = ref(0);

const NORMAL_BASE_SIZE = 30;
const NORAML_MONOS: Mono[] = [{
	id: '9377076d-c980-4d83-bdaf-175bc58275b7',
	level: 10,
	size: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'circle',
	score: 512,
	dropCandidate: false,
	sfxPitch: 0.25,
	img: '/client-assets/drop-and-fusion/exploding_head.png',
	imgSize: 256,
	spriteScale: 1.12,
}, {
	id: 'be9f38d2-b267-4b1a-b420-904e22e80568',
	level: 9,
	size: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'circle',
	score: 256,
	dropCandidate: false,
	sfxPitch: 0.5,
	img: '/client-assets/drop-and-fusion/face_with_symbols_on_mouth.png',
	imgSize: 256,
	spriteScale: 1.12,
}, {
	id: 'beb30459-b064-4888-926b-f572e4e72e0c',
	level: 8,
	size: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'circle',
	score: 128,
	dropCandidate: false,
	sfxPitch: 0.75,
	img: '/client-assets/drop-and-fusion/cold_face.png',
	imgSize: 256,
	spriteScale: 1.12,
}, {
	id: 'feab6426-d9d8-49ae-849c-048cdbb6cdf0',
	level: 7,
	size: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'circle',
	score: 64,
	dropCandidate: false,
	sfxPitch: 1,
	img: '/client-assets/drop-and-fusion/zany_face.png',
	imgSize: 256,
	spriteScale: 1.12,
}, {
	id: 'd6d8fed6-6d18-4726-81a1-6cf2c974df8a',
	level: 6,
	size: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'circle',
	score: 32,
	dropCandidate: false,
	sfxPitch: 1.5,
	img: '/client-assets/drop-and-fusion/pleading_face.png',
	imgSize: 256,
	spriteScale: 1.12,
}, {
	id: '249c728e-230f-4332-bbbf-281c271c75b2',
	level: 5,
	size: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'circle',
	score: 16,
	dropCandidate: true,
	sfxPitch: 2,
	img: '/client-assets/drop-and-fusion/face_with_open_mouth.png',
	imgSize: 256,
	spriteScale: 1.12,
}, {
	id: '23d67613-d484-4a93-b71e-3e81b19d6186',
	level: 4,
	size: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25,
	shape: 'circle',
	score: 8,
	dropCandidate: true,
	sfxPitch: 2.5,
	img: '/client-assets/drop-and-fusion/smiling_face_with_sunglasses.png',
	imgSize: 256,
	spriteScale: 1.12,
}, {
	id: '3cbd0add-ad7d-4685-bad0-29f6dddc0b99',
	level: 3,
	size: NORMAL_BASE_SIZE * 1.25 * 1.25,
	shape: 'circle',
	score: 4,
	dropCandidate: true,
	sfxPitch: 3,
	img: '/client-assets/drop-and-fusion/grinning_squinting_face.png',
	imgSize: 256,
	spriteScale: 1.12,
}, {
	id: '8f86d4f4-ee02-41bf-ad38-1ce0ae457fb5',
	level: 2,
	size: NORMAL_BASE_SIZE * 1.25,
	shape: 'circle',
	score: 2,
	dropCandidate: true,
	sfxPitch: 3.5,
	img: '/client-assets/drop-and-fusion/smiling_face_with_hearts.png',
	imgSize: 256,
	spriteScale: 1.12,
}, {
	id: '64ec4add-ce39-42b4-96cb-33908f3f118d',
	level: 1,
	size: NORMAL_BASE_SIZE,
	shape: 'circle',
	score: 1,
	dropCandidate: true,
	sfxPitch: 4,
	img: '/client-assets/drop-and-fusion/heart_suit.png',
	imgSize: 256,
	spriteScale: 1.12,
}];

const SQUARE_BASE_SIZE = 28;
const SQUARE_MONOS: Mono[] = [{
	id: 'f75fd0ba-d3d4-40a4-9712-b470e45b0525',
	level: 10,
	size: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'rectangle',
	score: 512,
	dropCandidate: false,
	sfxPitch: 0.25,
	img: '/client-assets/drop-and-fusion/keycap_10.png',
	imgSize: 256,
	spriteScale: 1.12,
}, {
	id: '7b70f4af-1c01-45fd-af72-61b1f01e03d1',
	level: 9,
	size: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'rectangle',
	score: 256,
	dropCandidate: false,
	sfxPitch: 0.5,
	img: '/client-assets/drop-and-fusion/keycap_9.png',
	imgSize: 256,
	spriteScale: 1.12,
}, {
	id: '41607ef3-b6d6-4829-95b6-3737bf8bb956',
	level: 8,
	size: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'rectangle',
	score: 128,
	dropCandidate: false,
	sfxPitch: 0.75,
	img: '/client-assets/drop-and-fusion/keycap_8.png',
	imgSize: 256,
	spriteScale: 1.12,
}, {
	id: '8a8310d2-0374-460f-bb50-ca9cd3ee3416',
	level: 7,
	size: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'rectangle',
	score: 64,
	dropCandidate: false,
	sfxPitch: 1,
	img: '/client-assets/drop-and-fusion/keycap_7.png',
	imgSize: 256,
	spriteScale: 1.12,
}, {
	id: '1092e069-fe1a-450b-be97-b5d477ec398c',
	level: 6,
	size: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'rectangle',
	score: 32,
	dropCandidate: false,
	sfxPitch: 1.5,
	img: '/client-assets/drop-and-fusion/keycap_6.png',
	imgSize: 256,
	spriteScale: 1.12,
}, {
	id: '2294734d-7bb8-4781-bb7b-ef3820abf3d0',
	level: 5,
	size: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'rectangle',
	score: 16,
	dropCandidate: true,
	sfxPitch: 2,
	img: '/client-assets/drop-and-fusion/keycap_5.png',
	imgSize: 256,
	spriteScale: 1.12,
}, {
	id: 'ea8a61af-e350-45f7-ba6a-366fcd65692a',
	level: 4,
	size: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25,
	shape: 'rectangle',
	score: 8,
	dropCandidate: true,
	sfxPitch: 2.5,
	img: '/client-assets/drop-and-fusion/keycap_4.png',
	imgSize: 256,
	spriteScale: 1.12,
}, {
	id: 'd0c74815-fc1c-4fbe-9953-c92e4b20f919',
	level: 3,
	size: SQUARE_BASE_SIZE * 1.25 * 1.25,
	shape: 'rectangle',
	score: 4,
	dropCandidate: true,
	sfxPitch: 3,
	img: '/client-assets/drop-and-fusion/keycap_3.png',
	imgSize: 256,
	spriteScale: 1.12,
}, {
	id: 'd8fbd70e-611d-402d-87da-1a7fd8cd2c8d',
	level: 2,
	size: SQUARE_BASE_SIZE * 1.25,
	shape: 'rectangle',
	score: 2,
	dropCandidate: true,
	sfxPitch: 3.5,
	img: '/client-assets/drop-and-fusion/keycap_2.png',
	imgSize: 256,
	spriteScale: 1.12,
}, {
	id: '35e476ee-44bd-4711-ad42-87be245d3efd',
	level: 1,
	size: SQUARE_BASE_SIZE,
	shape: 'rectangle',
	score: 1,
	dropCandidate: true,
	sfxPitch: 4,
	img: '/client-assets/drop-and-fusion/keycap_1.png',
	imgSize: 256,
	spriteScale: 1.12,
}];

const GAME_WIDTH = 450;
const GAME_HEIGHT = 600;

let viewScaleX = 1;
let viewScaleY = 1;
const currentPick = shallowRef<{ id: string; mono: Mono } | null>(null);
const stock = shallowRef<{ id: string; mono: Mono }[]>([]);
const score = ref(0);
const combo = ref(0);
const comboPrev = ref(0);
const maxCombo = ref(0);
const dropReady = ref(true);
const gameMode = ref<'normal' | 'square'>('normal');
const gameOver = ref(false);
const gameStarted = ref(false);
const highScore = ref<number | null>(null);
const showConfig = ref(false);
const bgmVolume = ref(0.1);

let game: DropAndFusionGame;
let containerElRect: DOMRect | null = null;

function onClick(ev: MouseEvent) {
	if (!containerElRect) return;
	const x = (ev.clientX - containerElRect.left) / viewScaleX;
	game.drop(x);
}

function onTouchend(ev: TouchEvent) {
	if (!containerElRect) return;
	const x = (ev.changedTouches[0].clientX - containerElRect.left) / viewScaleX;
	game.drop(x);
}

function onMousemove(ev: MouseEvent) {
	if (!containerElRect) return;
	const x = (ev.clientX - containerElRect.left);
	moveDropper(containerElRect, x);
}

function onTouchmove(ev: TouchEvent) {
	if (!containerElRect) return;
	const x = (ev.touches[0].clientX - containerElRect.left);
	moveDropper(containerElRect, x);
}

function moveDropper(rect: DOMRect, x: number) {
	dropperX.value = Math.min(rect.width * ((GAME_WIDTH - game.PLAYAREA_MARGIN) / GAME_WIDTH), Math.max(rect.width * (game.PLAYAREA_MARGIN / GAME_WIDTH), x));
}

function restart() {
	game.dispose();
	gameOver.value = false;
	currentPick.value = null;
	dropReady.value = true;
	stock.value = [];
	score.value = 0;
	combo.value = 0;
	comboPrev.value = 0;
	gameStarted.value = false;
}

function attachGameEvents() {
	game.addListener('changeScore', value => {
		score.value = value;
	});

	game.addListener('changeCombo', value => {
		if (value === 0) {
			comboPrev.value = combo.value;
		} else {
			comboPrev.value = value;
		}
		maxCombo.value = Math.max(maxCombo.value, value);
		combo.value = value;
	});

	game.addListener('changeStock', value => {
		currentPick.value = JSON.parse(JSON.stringify(value[0]));
		stock.value = JSON.parse(JSON.stringify(value.slice(1)));
	});

	game.addListener('dropped', () => {
		dropReady.value = false;
		window.setTimeout(() => {
			if (!gameOver.value) {
				dropReady.value = true;
			}
		}, game.DROP_INTERVAL);
	});

	game.addListener('fusioned', (x, y, scoreDelta) => {
		if (!canvasEl.value) return;

		const rect = canvasEl.value.getBoundingClientRect();
		const domX = rect.left + (x * viewScaleX);
		const domY = rect.top + (y * viewScaleY);
		os.popup(MkRippleEffect, { x: domX, y: domY }, {}, 'end');
		os.popup(MkPlusOneEffect, { x: domX, y: domY, value: scoreDelta }, {}, 'end');
	});

	game.addListener('monoAdded', (mono) => {
		// 実績関連
		if (mono.level === 10) {
			claimAchievement('bubbleGameExplodingHead');

			const monos = game.getActiveMonos();
			if (monos.filter(x => x.level === 10).length >= 2) {
				claimAchievement('bubbleGameDoubleExplodingHead');
			}
		}
	});

	game.addListener('gameOver', () => {
		currentPick.value = null;
		dropReady.value = false;
		gameOver.value = true;

		if (score.value > (highScore.value ?? 0)) {
			highScore.value = score.value;

			misskeyApi('i/registry/set', {
				scope: ['dropAndFusionGame'],
				key: 'highScore:' + gameMode.value,
				value: highScore.value,
			});
		}
	});
}

let bgmNodes: ReturnType<typeof sound.createSourceNode> = null;

async function start() {
	try {
		highScore.value = await misskeyApi('i/registry/get', {
			scope: ['dropAndFusionGame'],
			key: 'highScore:' + gameMode.value,
		});
	} catch (err) {
		highScore.value = null;
	}

	game = new DropAndFusionGame({
		width: GAME_WIDTH,
		height: GAME_HEIGHT,
		canvas: canvasEl.value!,
		...(
			gameMode.value === 'normal' ? {
				monoDefinitions: NORAML_MONOS,
			} : {
				monoDefinitions: SQUARE_MONOS,
			}
		),
	});
	attachGameEvents();
	os.promiseDialog(game.load(), async () => {
		game.start();
		gameStarted.value = true;

		if (bgmNodes) {
			bgmNodes.soundSource.stop();
			bgmNodes = null;
		}
		const bgmBuffer = await sound.loadAudio('/client-assets/drop-and-fusion/bgm_1.mp3');
		if (!bgmBuffer) return;
		bgmNodes = sound.createSourceNode(bgmBuffer, bgmVolume.value);
		if (!bgmNodes) return;
		bgmNodes.soundSource.loop = true;
		bgmNodes.soundSource.start();
	});
}

watch(bgmVolume, (value) => {
	if (bgmNodes) {
		bgmNodes.gainNode.gain.value = value;
	}
});

function getGameImageDriveFile() {
	return new Promise<Misskey.entities.DriveFile | null>(res => {
		const dcanvas = document.createElement('canvas');
		dcanvas.width = GAME_WIDTH;
		dcanvas.height = GAME_HEIGHT;
		const ctx = dcanvas.getContext('2d');
		if (!ctx || !canvasEl.value) return res(null);
		const dimage = new Image();
		dimage.src = '/client-assets/drop-and-fusion/frame-light.svg';
		dimage.addEventListener('load', () => {
			ctx.fillStyle = '#fff';
			ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
			ctx.drawImage(dimage, 0, 0, GAME_WIDTH, GAME_HEIGHT);
			ctx.drawImage(canvasEl.value!, 0, 0, GAME_WIDTH, GAME_HEIGHT);

			dcanvas.toBlob(blob => {
				if (!blob) return res(null);
				if ($i == null) return res(null);
				const formData = new FormData();
				formData.append('file', blob);
				formData.append('name', `bubble-game-${Date.now()}.png`);
				formData.append('isSensitive', 'false');
				formData.append('comment', 'null');
				formData.append('i', $i.token);
				if (defaultStore.state.uploadFolder) {
					formData.append('folderId', defaultStore.state.uploadFolder);
				}

				window.fetch(apiUrl + '/drive/files/create', {
					method: 'POST',
					body: formData,
				})
					.then(response => response.json())
					.then(f => {
						res(f);
					});
			}, 'image/png');

			dcanvas.remove();
		});
	});
}

async function share() {
	const uploading = getGameImageDriveFile();
	os.promiseDialog(uploading);
	const file = await uploading;
	if (!file) return;
	os.post({
		initialText: `#BubbleGame
MODE: ${gameMode.value}
SCORE: ${score.value} (MAX CHAIN: ${maxCombo.value})})`,
		initialFiles: [file],
	});
}

useInterval(() => {
	if (!canvasEl.value) return;
	const actualCanvasWidth = canvasEl.value.getBoundingClientRect().width;
	const actualCanvasHeight = canvasEl.value.getBoundingClientRect().height;
	viewScaleX = actualCanvasWidth / GAME_WIDTH;
	viewScaleY = actualCanvasHeight / GAME_HEIGHT;
	containerElRect = containerEl.value?.getBoundingClientRect() ?? null;
}, 1000, { immediate: false, afterMounted: true });

onDeactivated(() => {
	game.dispose();
});

definePageMetadata({
	title: i18n.ts.bubbleGame,
	icon: 'ti ti-apple',
});
</script>

<style lang="scss" module>
.transition_stock_move,
.transition_stock_enterActive,
.transition_stock_leaveActive {
	transition: opacity 0.4s cubic-bezier(0,.5,.5,1), transform 0.4s cubic-bezier(0,.5,.5,1) !important;
}
.transition_stock_enterFrom,
.transition_stock_leaveTo {
	opacity: 0;
	transform: scale(0.7);
}
.transition_stock_leaveActive {
	position: absolute;
}

.transition_picked_move,
.transition_picked_enterActive {
	transition: opacity 0.5s cubic-bezier(0,.5,.5,1), transform 0.5s cubic-bezier(0,.5,.5,1) !important;
}
.transition_picked_leaveActive {
	transition: all 0s !important;
}
.transition_picked_enterFrom,
.transition_picked_leaveTo {
	opacity: 0;
	transform: translateY(-50px);
}
.transition_picked_leaveActive {
	position: absolute;
}

.transition_combo_move,
.transition_combo_enterActive {
	transition: all 0s !important;
}
.transition_combo_leaveActive {
	transition: opacity 0.4s cubic-bezier(0,.5,.5,1), transform 0.4s cubic-bezier(0,.5,.5,1) !important;
}
.transition_combo_enterFrom,
.transition_combo_leaveTo {
	opacity: 0;
	transform: scale(0.7);
}
.transition_combo_leaveActive {
	position: absolute;
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
.frameInner {
	padding: 4px 8px;
	background: #F1E8DC;
	box-shadow: 0 0 2px 1px #ce8a5c, inset 0 0 1px 1px #693410;
	border-radius: 6px;
	color: #693410;
}

.main {
	position: relative;
}

.mainFrameImg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	// なんかiOSでちらつく
	//filter: drop-shadow(0 6px 16px #0007);
	pointer-events: none;
	user-select: none;
}

.canvas {
	position: relative;
	display: block;
	z-index: 1;
	margin-top: -50px;
	width: 100% !important;
	height: auto !important;
	pointer-events: none;
	user-select: none;
}

.container {
	position: relative;
}

.stock {
	pointer-events: none;
	user-select: none;
}

.combo {
	position: absolute;
	z-index: 3;
	top: 50%;
	width: 100%;
	text-align: center;
	font-weight: bold;
	font-style: oblique;
	color: #fff;
	-webkit-text-stroke: 1px rgb(255, 145, 0);
	text-shadow: 0 0 6px #0005;
	pointer-events: none;
	user-select: none;
}

.currentMono {
	position: absolute;
	margin-top: 80px;
	z-index: 2;
	filter: drop-shadow(0 6px 16px #0007);
	pointer-events: none;
	user-select: none;
}

.dropper {
	position: absolute;
	top: 0;
	width: 70px;
	margin-top: -10px;
	margin-left: -30px;
	z-index: 2;
	filter: drop-shadow(0 6px 16px #0007);
	pointer-events: none;
	user-select: none;
}

.currentMonoArrow {
	position: absolute;
	margin-top: 100px;
	z-index: 3;
	animation: currentMonoArrow 2s ease infinite;
	pointer-events: none;
	user-select: none;
}

.dropGuide {
	position: absolute;
	top: 120px;
	z-index: 3;
	width: 3px;
	height: calc(100% - 120px);
	background: #f002;
	pointer-events: none;
	user-select: none;
}

.gameOverLabel {
	position: absolute;
	z-index: 10;
	top: 50%;
	width: 100%;
	padding: 16px;
	box-sizing: border-box;
	background: #0007;
	color: #fff;
	text-align: center;
	font-weight: bold;
}

.gameOver {
	.canvas {
		filter: grayscale(1);
	}
}

@keyframes currentMonoArrow {
	0% { transform: translateY(0); }
	25% { transform: translateY(-8px); }
	50% { transform: translateY(0); }
	75% { transform: translateY(-8px); }
	100% { transform: translateY(0); }
}
</style>
