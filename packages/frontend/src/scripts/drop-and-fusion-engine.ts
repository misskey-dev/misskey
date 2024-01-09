/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'eventemitter3';
import * as Matter from 'matter-js';
import seedrandom from 'seedrandom';
import * as sound from '@/scripts/sound.js';

export type Mono = {
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

type Log = {
	frame: number;
	operation: 'drop';
	x: number;
} | {
	frame: number;
	operation: 'hold';
} | {
	frame: number;
	operation: 'surrender';
};

export class DropAndFusionGame extends EventEmitter<{
	changeScore: (newScore: number) => void;
	changeCombo: (newCombo: number) => void;
	changeStock: (newStock: { id: string; mono: Mono }[]) => void;
	changeHolding: (newHolding: { id: string; mono: Mono } | null) => void;
	dropped: () => void;
	fusioned: (x: number, y: number, scoreDelta: number) => void;
	monoAdded: (mono: Mono) => void;
	gameOver: () => void;
}> {
	private PHYSICS_QUALITY_FACTOR = 16; // 低いほどパフォーマンスが高いがガタガタして安定しなくなる、逆に高すぎても何故か不安定になる
	private COMBO_INTERVAL = 1000;
	public readonly DROP_INTERVAL = 500;
	public readonly PLAYAREA_MARGIN = 25;
	private STOCK_MAX = 4;
	private TICK_DELTA = 1000 / 60; // 60fps
	private loaded = false;
	private frame = 0;
	private engine: Matter.Engine;
	private render: Matter.Render;
	private tickRaf: ReturnType<typeof requestAnimationFrame> | null = null;
	private tickCallbackQueue: { frame: number; callback: () => void; }[] = [];
	private overflowCollider: Matter.Body;
	private isGameOver = false;
	private gameWidth: number;
	private gameHeight: number;
	private monoDefinitions: Mono[] = [];
	private monoTextures: Record<string, Blob> = {};
	private monoTextureUrls: Record<string, string> = {};
	private rng: () => number;
	private logs: Log[] = [];
	private replaying = false;

	private sfxVolume = 1;

	/**
	 * フィールドに出ていて、かつ合体の対象となるアイテム
	 */
	private activeBodyIds: Matter.Body['id'][] = [];

	private latestDroppedBodyId: Matter.Body['id'] | null = null;

	private latestDroppedAt = 0;
	private latestFusionedAt = 0;
	private stock: { id: string; mono: Mono }[] = [];
	private holding: { id: string; mono: Mono } | null = null;

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
		canvas: HTMLCanvasElement;
		width: number;
		height: number;
		monoDefinitions: Mono[];
		seed: string;
		sfxVolume?: number;
	}) {
		super();

		this.tick = this.tick.bind(this);

		this.gameWidth = opts.width;
		this.gameHeight = opts.height;
		this.monoDefinitions = opts.monoDefinitions;
		this.rng = seedrandom(opts.seed);

		if (opts.sfxVolume) {
			this.sfxVolume = opts.sfxVolume;
		}

		this.engine = Matter.Engine.create({
			constraintIterations: 2 * this.PHYSICS_QUALITY_FACTOR,
			positionIterations: 6 * this.PHYSICS_QUALITY_FACTOR,
			velocityIterations: 4 * this.PHYSICS_QUALITY_FACTOR,
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
			canvas: opts.canvas,
			options: {
				width: this.gameWidth,
				height: this.gameHeight,
				background: 'transparent', // transparent to hide
				wireframeBackground: 'transparent', // transparent to hide
				wireframes: false,
				showSleeping: false,
				pixelRatio: Math.max(2, window.devicePixelRatio),
			},
		});

		Matter.Render.run(this.render);

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
			Matter.Bodies.rectangle(this.gameWidth / 2, this.gameHeight + (thickness / 2) - this.PLAYAREA_MARGIN, this.gameWidth, thickness, WALL_OPTIONS),
			Matter.Bodies.rectangle(this.gameWidth + (thickness / 2) - this.PLAYAREA_MARGIN, this.gameHeight / 2, thickness, this.gameHeight, WALL_OPTIONS),
			Matter.Bodies.rectangle(-((thickness / 2) - this.PLAYAREA_MARGIN), this.gameHeight / 2, thickness, this.gameHeight, WALL_OPTIONS),
		]);
		//#endregion

		this.overflowCollider = Matter.Bodies.rectangle(this.gameWidth / 2, 0, this.gameWidth, 200, {
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
			max: { x: this.gameWidth, y: this.gameHeight },
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
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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

		// TODO: 単に位置だけでなくそれぞれの動きベクトルも融合する？
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
			this.tickCallbackQueue.push({
				frame: this.frame + 6,
				callback: () => {
					this.activeBodyIds.push(body.id);
				},
			});

			const comboBonus = 1 + ((this.combo - 1) / 5);
			const additionalScore = Math.round(currentMono.score * comboBonus);
			this.score += additionalScore;

			// TODO: 効果音再生はコンポーネント側の責務なので移動する
			const pan = ((newX / this.gameWidth) - 0.5) * 2;
			sound.playUrl('/client-assets/drop-and-fusion/bubble2.mp3', {
				volume: this.sfxVolume,
				pan,
				playbackRate: nextMono.sfxPitch,
			});

			this.emit('monoAdded', nextMono);
			this.emit('fusioned', newX, newY, additionalScore);
		} else {
			//const VELOCITY = 30;
			//for (let i = 0; i < 10; i++) {
			//	const body = createBody(FRUITS.find(x => x.level === (1 + Math.floor(this.rng() * 3)))!, x + ((this.rng() * VELOCITY) - (VELOCITY / 2)), y + ((this.rng() * VELOCITY) - (VELOCITY / 2)));
			//	Matter.Composite.add(world, body);
			//	bodies.push(body);
			//}
			//sound.playUrl({
			//	type: 'syuilo/bubble2',
			//	volume: this.sfxVolume,
			//});
		}
	}

	public surrender() {
		this.logs.push({
			frame: this.frame,
			operation: 'surrender',
		});

		this.gameOver();
	}

	private gameOver() {
		this.isGameOver = true;
		if (this.tickRaf) window.cancelAnimationFrame(this.tickRaf);
		this.tickRaf = null;
		this.emit('gameOver');

		// TODO: 効果音再生はコンポーネント側の責務なので移動する
		sound.playUrl('/client-assets/drop-and-fusion/gameover.mp3', {
			volume: this.sfxVolume,
		});
	}

	/** テクスチャをすべてキャッシュする */
	private async loadMonoTextures() {
		async function loadSingleMonoTexture(mono: Mono, game: DropAndFusionGame) {
			// Matter-js内にキャッシュがある場合はスキップ
			if (game.render.textures[mono.img]) return;
			console.log('loading', mono.img);

			let src = mono.img;
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (game.monoTextureUrls[mono.img]) {
				src = game.monoTextureUrls[mono.img];
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			} else if (game.monoTextures[mono.img]) {
				src = URL.createObjectURL(game.monoTextures[mono.img]);
				game.monoTextureUrls[mono.img] = src;
			} else {
				const res = await fetch(mono.img);
				const blob = await res.blob();
				game.monoTextures[mono.img] = blob;
				src = URL.createObjectURL(blob);
				game.monoTextureUrls[mono.img] = src;
			}

			const image = new Image();
			image.src = src;
			game.render.textures[mono.img] = image;
		}

		return Promise.all(this.monoDefinitions.map(x => loadSingleMonoTexture(x, this)));
	}

	public start(logs?: Log[]) {
		if (!this.loaded) throw new Error('game is not loaded yet');
		if (logs) this.replaying = true;

		for (let i = 0; i < this.STOCK_MAX; i++) {
			this.stock.push({
				id: this.rng().toString(),
				mono: this.monoDefinitions.filter(x => x.dropCandidate)[Math.floor(this.rng() * this.monoDefinitions.filter(x => x.dropCandidate).length)],
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
						this.tickCallbackQueue.push({
							frame: this.frame + 6,
							callback: () => {
								fusionReservedPairs = fusionReservedPairs.filter(x => x.bodyA.id !== bodyA.id && x.bodyB.id !== bodyB.id);
								this.fusion(bodyA, bodyB);
							},
						});
					}
				} else {
					const energy = pairs.collision.depth;
					if (energy > minCollisionEnergyForSound) {
						// TODO: 効果音再生はコンポーネント側の責務なので移動する
						const vol = ((Math.min(maxCollisionEnergyForSound, energy - minCollisionEnergyForSound) / maxCollisionEnergyForSound) / 4) * this.sfxVolume;
						const pan = ((((bodyA.position.x + bodyB.position.x) / 2) / this.gameWidth) - 0.5) * 2;
						const pitch = soundPitchMin + ((soundPitchMax - soundPitchMin) * (1 - (Math.min(10, energy) / 10)));
						sound.playUrl('/client-assets/drop-and-fusion/poi1.mp3', {
							volume: vol,
							pan,
							playbackRate: pitch,
						});
					}
				}
			}
		});

		this.comboIntervalId = window.setInterval(() => {
			if (this.latestFusionedAt < Date.now() - this.COMBO_INTERVAL) {
				this.combo = 0;
			}
		}, 500);

		if (logs) {
			const playTick = () => {
				this.frame++;
				const log = logs.find(x => x.frame === this.frame - 1);
				if (log) {
					switch (log.operation) {
						case 'drop': {
							this.drop(log.x);
							break;
						}
						case 'hold': {
							this.hold();
							break;
						}
						case 'surrender': {
							this.surrender();
							break;
						}
						default:
							break;
					}
				}
				this.tickCallbackQueue = this.tickCallbackQueue.filter(x => {
					if (x.frame === this.frame) {
						x.callback();
						return false;
					} else {
						return true;
					}
				});

				Matter.Engine.update(this.engine, this.TICK_DELTA);

				if (!this.isGameOver) {
					this.tickRaf = window.requestAnimationFrame(playTick);
				}
			};

			playTick();
		} else {
			this.tick();
		}
	}

	public getLogs() {
		return this.logs;
	}

	private tick() {
		this.frame++;
		this.tickCallbackQueue = this.tickCallbackQueue.filter(x => {
			if (x.frame === this.frame) {
				x.callback();
				return false;
			} else {
				return true;
			}
		});
		Matter.Engine.update(this.engine, this.TICK_DELTA);
		if (!this.isGameOver) {
			this.tickRaf = window.requestAnimationFrame(this.tick);
		}
	}

	public async load() {
		await this.loadMonoTextures();
		this.loaded = true;
	}

	public setSfxVolume(volume: number) {
		this.sfxVolume = volume;
	}

	public getTextureImageUrl(mono: Mono) {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (this.monoTextureUrls[mono.img]) {
			return this.monoTextureUrls[mono.img];

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		} else if (this.monoTextures[mono.img]) {
			// Gameクラス内にキャッシュがある場合はそれを使う
			const out = URL.createObjectURL(this.monoTextures[mono.img]);
			this.monoTextureUrls[mono.img] = out;
			return out;
		} else {
			return mono.img;
		}
	}

	public getActiveMonos() {
		return this.engine.world.bodies.map(x => this.monoDefinitions.find((mono) => mono.id === x.label)!).filter(x => x !== undefined);
	}

	public drop(_x: number) {
		if (this.isGameOver) return;
		if (!this.replaying && (Date.now() - this.latestDroppedAt < this.DROP_INTERVAL)) return;

		const head = this.stock.shift()!;
		this.stock.push({
			id: this.rng().toString(),
			mono: this.monoDefinitions.filter(x => x.dropCandidate)[Math.floor(this.rng() * this.monoDefinitions.filter(x => x.dropCandidate).length)],
		});
		this.emit('changeStock', this.stock);

		const x = Math.min(this.gameWidth - this.PLAYAREA_MARGIN - (head.mono.size / 2), Math.max(this.PLAYAREA_MARGIN + (head.mono.size / 2), Math.round(_x)));
		const body = this.createBody(head.mono, x, 50 + head.mono.size / 2);
		this.logs.push({
			frame: this.frame,
			operation: 'drop',
			x,
		});
		Matter.Composite.add(this.engine.world, body);
		this.activeBodyIds.push(body.id);
		this.latestDroppedBodyId = body.id;
		this.latestDroppedAt = Date.now();
		this.emit('dropped');
		this.emit('monoAdded', head.mono);

		// TODO: 効果音再生はコンポーネント側の責務なので移動する
		const pan = ((x / this.gameWidth) - 0.5) * 2;
		sound.playUrl('/client-assets/drop-and-fusion/poi2.mp3', {
			volume: this.sfxVolume,
			pan,
		});
	}

	public hold() {
		if (this.isGameOver) return;

		this.logs.push({
			frame: this.frame,
			operation: 'hold',
		});

		if (this.holding) {
			const head = this.stock.shift()!;
			this.stock.unshift(this.holding);
			this.holding = head;
			this.emit('changeHolding', this.holding);
			this.emit('changeStock', this.stock);
		} else {
			const head = this.stock.shift()!;
			this.holding = head;
			this.stock.push({
				id: this.rng().toString(),
				mono: this.monoDefinitions.filter(x => x.dropCandidate)[Math.floor(this.rng() * this.monoDefinitions.filter(x => x.dropCandidate).length)],
			});
			this.emit('changeHolding', this.holding);
			this.emit('changeStock', this.stock);
		}

		sound.playUrl('/client-assets/drop-and-fusion/hold.mp3', {
			volume: 0.5 * this.sfxVolume,
		});
	}

	public dispose() {
		if (this.comboIntervalId) window.clearInterval(this.comboIntervalId);
		if (this.tickRaf) window.cancelAnimationFrame(this.tickRaf);
		this.tickRaf = null;
		Matter.Render.stop(this.render);
		Matter.World.clear(this.engine.world, false);
		Matter.Engine.clear(this.engine);
	}
}
