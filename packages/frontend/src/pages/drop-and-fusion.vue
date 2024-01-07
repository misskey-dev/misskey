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
								<img :src="x.mono.img" style="width: 32px;"/>
							</div>
						</TransitionGroup>
					</div>
				</div>
			</div>
			<div :class="$style.main">
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
					<img v-if="currentPick" src="/client-assets/drop-and-fusion/dropper.png" :class="$style.dropper" :style="{ left: mouseX + 'px' }"/>
					<Transition
						:enterActiveClass="$style.transition_picked_enterActive"
						:leaveActiveClass="$style.transition_picked_leaveActive"
						:enterFromClass="$style.transition_picked_enterFrom"
						:leaveToClass="$style.transition_picked_leaveTo"
						:moveClass="$style.transition_picked_move"
						mode="out-in"
					>
						<img v-if="currentPick" :key="currentPick.id" :src="currentPick?.mono.img" :class="$style.currentMono" :style="{ top: -(currentPick?.mono.size / 2) + 'px', left: (mouseX - (currentPick?.mono.size / 2)) + 'px', width: `${currentPick?.mono.size}px` }"/>
					</Transition>
					<template v-if="dropReady">
						<img src="/client-assets/drop-and-fusion/drop-arrow.svg" :class="$style.currentMonoArrow" :style="{ top: (currentPick?.mono.size / 2) + 10 + 'px', left: (mouseX - 10) + 'px', width: `20px` }"/>
						<div :class="$style.dropGuide" :style="{ left: (mouseX - 2) + 'px' }"/>
					</template>
					<div v-if="gameOver" :class="$style.gameOverLabel">
						<div class="_gaps_s">
							<img src="/client-assets/drop-and-fusion/gameover.png" style="width: 200px; max-width: 100%; display: block; margin: auto; margin-bottom: -5px;"/>
							<div>SCORE: <MkNumber :value="score"/></div>
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
						<div>SCORE: <b><MkNumber :value="score"/></b></div>
						<div>HIGH SCORE: <b v-if="highScore"><MkNumber :value="highScore"/></b><b v-else>-</b></div>
					</div>
				</div>
				<div :class="[$style.frame]" style="margin-left: auto;">
					<div :class="$style.frameInner" style="text-align: center;">
					</div>
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
import * as Matter from 'matter-js';
import { onMounted, ref, shallowRef } from 'vue';
import { EventEmitter } from 'eventemitter3';
import * as Misskey from 'misskey-js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import * as sound from '@/scripts/sound.js';
import MkRippleEffect from '@/components/MkRippleEffect.vue';
import * as os from '@/os.js';
import MkNumber from '@/components/MkNumber.vue';
import MkPlusOneEffect from '@/components/MkPlusOneEffect.vue';
import MkButton from '@/components/MkButton.vue';
import { defaultStore } from '@/store.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { useInterval } from '@/scripts/use-interval.js';
import MkSelect from '@/components/MkSelect.vue';
import { apiUrl } from '@/config.js';
import { $i } from '@/account.js';

type Mono = {
	id: string;
	level: number;
	size: number;
	shape: 'circle' | 'rectangle';
	score: number;
	dropCandidate: boolean;
	sfxPitch: number;
	img: string;
	imgSize: number;
	spriteScale: number;
};

const containerEl = shallowRef<HTMLElement>();
const canvasEl = shallowRef<HTMLCanvasElement>();
const mouseX = ref(0);

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
const PHYSICS_QUALITY_FACTOR = 16; // 低いほどパフォーマンスが高いがガタガタして安定しなくなる、逆に高すぎても何故か不安定になる

let viewScaleX = 1;
let viewScaleY = 1;
const currentPick = shallowRef<{ id: string; mono: Mono } | null>(null);
const stock = shallowRef<{ id: string; mono: Mono }[]>([]);
const score = ref(0);
const combo = ref(0);
const comboPrev = ref(0);
const dropReady = ref(true);
const gameMode = ref<'normal' | 'square'>('normal');
const gameOver = ref(false);
const gameStarted = ref(false);
const highScore = ref<number | null>(null);

class Game extends EventEmitter<{
	changeScore: (score: number) => void;
	changeCombo: (combo: number) => void;
	changeStock: (stock: { id: string; mono: Mono }[]) => void;
	dropped: () => void;
	fusioned: (x: number, y: number, score: number) => void;
	gameOver: () => void;
}> {
	private COMBO_INTERVAL = 1000;
	public readonly DROP_INTERVAL = 500;
	private PLAYAREA_MARGIN = 25;
	private STOCK_MAX = 4;
	private engine: Matter.Engine;
	private render: Matter.Render;
	private runner: Matter.Runner;
	private overflowCollider: Matter.Body;
	private isGameOver = false;

	private monoDefinitions: Mono[] = [];

	/**
	 * フィールドに出ていて、かつ合体の対象となるアイテム
	 */
	private activeBodyIds: Matter.Body['id'][] = [];

	private latestDroppedBodyId: Matter.Body['id'] | null = null;

	private latestDroppedAt = 0;
	private latestFusionedAt = 0;
	private stock: { id: string; mono: Mono }[] = [];

	private _combo = 0;
	private get combo() {
		return this._combo;
	}
	private set combo(value: number) {
		this._combo = value;
		this.emit('changeCombo', value);
	}

	private _score = 0;
	private get score() {
		return this._score;
	}
	private set score(value: number) {
		this._score = value;
		this.emit('changeScore', value);
	}

	private comboIntervalId: number | null = null;

	constructor(opts: {
		monoDefinitions: Mono[];
	}) {
		super();

		this.monoDefinitions = opts.monoDefinitions;

		this.engine = Matter.Engine.create({
			constraintIterations: 2 * PHYSICS_QUALITY_FACTOR,
			positionIterations: 6 * PHYSICS_QUALITY_FACTOR,
			velocityIterations: 4 * PHYSICS_QUALITY_FACTOR,
			gravity: {
				x: 0,
				y: 1,
			},
			timing: {
				timeScale: 2,
			},
			enableSleeping: false,
		});

		this.render = Matter.Render.create({
			engine: this.engine,
			canvas: canvasEl.value,
			options: {
				width: GAME_WIDTH,
				height: GAME_HEIGHT,
				background: 'transparent', // transparent to hide
				wireframeBackground: 'transparent', // transparent to hide
				wireframes: false,
				showSleeping: false,
				pixelRatio: Math.max(2, window.devicePixelRatio),
			},
		});

		Matter.Render.run(this.render);

		this.runner = Matter.Runner.create();
		Matter.Runner.run(this.runner, this.engine);

		this.engine.world.bodies = [];

		//#region walls
		const WALL_OPTIONS: Matter.IChamferableBodyDefinition = {
			isStatic: true,
			friction: 0.7,
			slop: 1.0,
			render: {
				strokeStyle: 'transparent',
				fillStyle: 'transparent',
			},
		};

		const thickness = 100;
		Matter.Composite.add(this.engine.world, [
			Matter.Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + (thickness / 2) - this.PLAYAREA_MARGIN, GAME_WIDTH, thickness, WALL_OPTIONS),
			Matter.Bodies.rectangle(GAME_WIDTH + (thickness / 2) - this.PLAYAREA_MARGIN, GAME_HEIGHT / 2, thickness, GAME_HEIGHT, WALL_OPTIONS),
			Matter.Bodies.rectangle(-((thickness / 2) - this.PLAYAREA_MARGIN), GAME_HEIGHT / 2, thickness, GAME_HEIGHT, WALL_OPTIONS),
		]);
		//#endregion

		this.overflowCollider = Matter.Bodies.rectangle(GAME_WIDTH / 2, 0, GAME_WIDTH, 200, {
			isStatic: true,
			isSensor: true,
			render: {
				strokeStyle: 'transparent',
				fillStyle: 'transparent',
			},
		});
		Matter.Composite.add(this.engine.world, this.overflowCollider);

		// fit the render viewport to the scene
		Matter.Render.lookAt(this.render, {
			min: { x: 0, y: 0 },
			max: { x: GAME_WIDTH, y: GAME_HEIGHT },
		});
	}

	private createBody(mono: Mono, x: number, y: number) {
		const options: Matter.IBodyDefinition = {
			label: mono.id,
			//density: 0.0005,
			density: mono.size / 1000,
			restitution: 0.2,
			frictionAir: 0.01,
			friction: 0.7,
			frictionStatic: 5,
			slop: 1.0,
			//mass: 0,
			render: {
				sprite: {
					texture: mono.img,
					xScale: (mono.size / mono.imgSize) * mono.spriteScale,
					yScale: (mono.size / mono.imgSize) * mono.spriteScale,
				},
			},
		};
		if (mono.shape === 'circle') {
			return Matter.Bodies.circle(x, y, mono.size / 2, options);
		} else if (mono.shape === 'rectangle') {
			return Matter.Bodies.rectangle(x, y, mono.size, mono.size, options);
		} else {
			throw new Error('unrecognized shape');
		}
	}

	private fusion(bodyA: Matter.Body, bodyB: Matter.Body) {
		const now = Date.now();
		if (this.latestFusionedAt > now - this.COMBO_INTERVAL) {
			this.combo++;
		} else {
			this.combo = 1;
		}
		this.latestFusionedAt = now;

		// TODO: 単に位置だけでなくそれぞれの動きベクトルも融合する
		const newX = (bodyA.position.x + bodyB.position.x) / 2;
		const newY = (bodyA.position.y + bodyB.position.y) / 2;

		Matter.Composite.remove(this.engine.world, [bodyA, bodyB]);
		this.activeBodyIds = this.activeBodyIds.filter(x => x !== bodyA.id && x !== bodyB.id);

		const currentMono = this.monoDefinitions.find(y => y.id === bodyA.label)!;
		const nextMono = this.monoDefinitions.find(x => x.level === currentMono.level + 1);

		if (nextMono) {
			const body = this.createBody(nextMono, newX, newY);
			Matter.Composite.add(this.engine.world, body);

			// 連鎖してfusionした場合の分かりやすさのため少し間を置いてからfusion対象になるようにする
			window.setTimeout(() => {
				this.activeBodyIds.push(body.id);
			}, 100);

			const comboBonus = 1 + ((this.combo - 1) / 5);
			const additionalScore = Math.round(currentMono.score * comboBonus);
			this.score += additionalScore;

			const pan = ((newX / GAME_WIDTH) - 0.5) * 2;
			sound.playRaw('syuilo/bubble2', 1, pan, nextMono.sfxPitch);

			this.emit('fusioned', newX, newY, additionalScore);
		} else {
			//const VELOCITY = 30;
			//for (let i = 0; i < 10; i++) {
			//	const body = createBody(FRUITS.find(x => x.level === (1 + Math.floor(Math.random() * 3)))!, x + ((Math.random() * VELOCITY) - (VELOCITY / 2)), y + ((Math.random() * VELOCITY) - (VELOCITY / 2)));
			//	Matter.Composite.add(world, body);
			//	bodies.push(body);
			//}
			//sound.playRaw({
			//	type: 'syuilo/bubble2',
			//	volume: 1,
			//});
		}
	}

	private gameOver() {
		this.isGameOver = true;
		Matter.Runner.stop(this.runner);
		this.emit('gameOver');
	}

	public start() {
		for (let i = 0; i < this.STOCK_MAX; i++) {
			this.stock.push({
				id: Math.random().toString(),
				mono: this.monoDefinitions.filter(x => x.dropCandidate)[Math.floor(Math.random() * this.monoDefinitions.filter(x => x.dropCandidate).length)],
			});
		}
		this.emit('changeStock', this.stock);

		// TODO: fusion予約状態のアイテムは光らせるなどの演出をすると楽しそう
		let fusionReservedPairs: { bodyA: Matter.Body; bodyB: Matter.Body }[] = [];

		const minCollisionEnergyForSound = 2.5;
		const maxCollisionEnergyForSound = 9;
		const soundPitchMax = 4;
		const soundPitchMin = 0.5;

		Matter.Events.on(this.engine, 'collisionStart', (event) => {
			for (const pairs of event.pairs) {
				const { bodyA, bodyB } = pairs;
				if (bodyA.id === this.overflowCollider.id || bodyB.id === this.overflowCollider.id) {
					if (bodyA.id === this.latestDroppedBodyId || bodyB.id === this.latestDroppedBodyId) {
						continue;
					}
					this.gameOver();
					break;
				}
				const shouldFusion = (bodyA.label === bodyB.label) && !fusionReservedPairs.some(x => x.bodyA.id === bodyA.id || x.bodyA.id === bodyB.id || x.bodyB.id === bodyA.id || x.bodyB.id === bodyB.id);
				if (shouldFusion) {
					if (this.activeBodyIds.includes(bodyA.id) && this.activeBodyIds.includes(bodyB.id)) {
						this.fusion(bodyA, bodyB);
					} else {
						fusionReservedPairs.push({ bodyA, bodyB });
						window.setTimeout(() => {
							fusionReservedPairs = fusionReservedPairs.filter(x => x.bodyA.id !== bodyA.id && x.bodyB.id !== bodyB.id);
							this.fusion(bodyA, bodyB);
						}, 100);
					}
				} else {
					const energy = pairs.collision.depth;
					if (energy > minCollisionEnergyForSound) {
						const vol = (Math.min(maxCollisionEnergyForSound, energy - minCollisionEnergyForSound) / maxCollisionEnergyForSound) / 4;
						const pan = ((((bodyA.position.x + bodyB.position.x) / 2) / GAME_WIDTH) - 0.5) * 2;
						const pitch = soundPitchMin + ((soundPitchMax - soundPitchMin) * (1 - (Math.min(10, energy) / 10)));
						sound.playRaw('syuilo/poi1', vol, pan, pitch);
					}
				}
			}
		});

		this.comboIntervalId = window.setInterval(() => {
			if (this.latestFusionedAt < Date.now() - this.COMBO_INTERVAL) {
				this.combo = 0;
			}
		}, 500);
	}

	public drop(_x: number) {
		if (this.isGameOver) return;
		if (Date.now() - this.latestDroppedAt < this.DROP_INTERVAL) {
			return;
		}
		const st = this.stock.shift()!;
		this.stock.push({
			id: Math.random().toString(),
			mono: this.monoDefinitions.filter(x => x.dropCandidate)[Math.floor(Math.random() * this.monoDefinitions.filter(x => x.dropCandidate).length)],
		});
		this.emit('changeStock', this.stock);

		const x = Math.min(GAME_WIDTH - this.PLAYAREA_MARGIN - (st.mono.size / 2), Math.max(this.PLAYAREA_MARGIN + (st.mono.size / 2), _x));
		const body = this.createBody(st.mono, x, 50 + st.mono.size / 2);
		Matter.Composite.add(this.engine.world, body);
		this.activeBodyIds.push(body.id);
		this.latestDroppedBodyId = body.id;
		this.latestDroppedAt = Date.now();
		this.emit('dropped');
		const pan = ((x / GAME_WIDTH) - 0.5) * 2;
		sound.playRaw('syuilo/poi2', 1, pan);
	}

	public dispose() {
		if (this.comboIntervalId) window.clearInterval(this.comboIntervalId);
		Matter.Render.stop(this.render);
		Matter.Runner.stop(this.runner);
		Matter.World.clear(this.engine.world, false);
		Matter.Engine.clear(this.engine);
	}
}

let game: Game;

function onClick(ev: MouseEvent) {
	const rect = containerEl.value!.getBoundingClientRect();

	const x = (ev.clientX - rect.left) / viewScaleX;

	game.drop(x);
}

function onTouchend(ev: TouchEvent) {
	const rect = containerEl.value!.getBoundingClientRect();

	const x = (ev.changedTouches[0].clientX - rect.left) / viewScaleX;

	game.drop(x);
}

function onMousemove(ev: MouseEvent) {
	mouseX.value = ev.clientX - containerEl.value!.getBoundingClientRect().left;
}

function onTouchmove(ev: TouchEvent) {
	mouseX.value = ev.touches[0].clientX - containerEl.value!.getBoundingClientRect().left;
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

function attachGame() {
	game.addListener('changeScore', value => {
		score.value = value;
	});

	game.addListener('changeCombo', value => {
		if (value === 0) {
			comboPrev.value = combo.value;
		} else {
			comboPrev.value = value;
		}
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

	game.addListener('fusioned', (x, y, score) => {
		const rect = canvasEl.value.getBoundingClientRect();
		const domX = rect.left + (x * viewScaleX);
		const domY = rect.top + (y * viewScaleY);
		os.popup(MkRippleEffect, { x: domX, y: domY }, {}, 'end');
		os.popup(MkPlusOneEffect, { x: domX, y: domY, value: score }, {}, 'end');
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

async function start() {
	try {
		highScore.value = await misskeyApi('i/registry/get', {
			scope: ['dropAndFusionGame'],
			key: 'highScore:' + gameMode.value,
		});
	} catch (err) {
	}

	gameStarted.value = true;
	game = new Game(gameMode.value === 'normal' ? {
		monoDefinitions: NORAML_MONOS,
	} : {
		monoDefinitions: SQUARE_MONOS,
	});
	attachGame();
	game.start();
}

function getGameImageDriveFile() {
	return new Promise<Misskey.entities.DriveFile | null>(res => {
		canvasEl.value?.toBlob(blob => {
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
SCORE: ${score.value}`,
		initialFiles: [file],
	});
}

useInterval(() => {
	if (!canvasEl.value) return;
	const actualCanvasWidth = canvasEl.value.getBoundingClientRect().width;
	const actualCanvasHeight = canvasEl.value.getBoundingClientRect().height;
	viewScaleX = actualCanvasWidth / GAME_WIDTH;
	viewScaleY = actualCanvasHeight / GAME_HEIGHT;
}, 1000, { immediate: false, afterMounted: true });

onMounted(async () => {
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
