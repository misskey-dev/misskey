/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'eventemitter3';
import * as Matter from 'matter-js';
import seedrandom from 'seedrandom';

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
	dropped: (x: number) => void;
	fusioned: (x: number, y: number, scoreDelta: number) => void;
	monoAdded: (mono: Mono) => void;
	gameOver: () => void;
	sfx(type: string, params: { volume: number; pan: number; pitch: number; }): void;
}> {
	private PHYSICS_QUALITY_FACTOR = 16; // 低いほどパフォーマンスが高いがガタガタして安定しなくなる、逆に高すぎても何故か不安定になる
	private COMBO_INTERVAL = 60; // frame
	public readonly GAME_VERSION = 1;
	public readonly GAME_WIDTH = 450;
	public readonly GAME_HEIGHT = 600;
	public readonly DROP_INTERVAL = 500;
	public readonly PLAYAREA_MARGIN = 25;
	private STOCK_MAX = 4;
	private TICK_DELTA = 1000 / 60; // 60fps

	public frame = 0;
	public engine: Matter.Engine;
	private tickCallbackQueue: { frame: number; callback: () => void; }[] = [];
	private overflowCollider: Matter.Body;
	private isGameOver = false;
	private monoDefinitions: Mono[] = [];
	private rng: () => number;
	private logs: Log[] = [];
	private replaying = false;

	/**
	 * フィールドに出ていて、かつ合体の対象となるアイテム
	 */
	private activeBodyIds: Matter.Body['id'][] = [];

	/**
	 * fusion予約アイテムのペア
	 * TODO: これらのモノは光らせるなどの演出をすると視覚的に楽しそう
	 */
	private fusionReservedPairs: { bodyA: Matter.Body; bodyB: Matter.Body }[] = [];

	private latestDroppedBodyId: Matter.Body['id'] | null = null;

	private latestDroppedAt = 0;
	private latestFusionedAt = 0; // frame
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

	public replayPlaybackRate = 1;

	constructor(env: { monoDefinitions: Mono[]; seed: string; replaying?: boolean }) {
		super();

		this.replaying = !!env.replaying;
		this.monoDefinitions = env.monoDefinitions;
		this.rng = seedrandom(env.seed);

		this.tick = this.tick.bind(this);

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

		this.engine.world.bodies = [];

		//#region walls
		const WALL_OPTIONS: Matter.IChamferableBodyDefinition = {
			label: '_wall_',
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
			Matter.Bodies.rectangle(this.GAME_WIDTH / 2, this.GAME_HEIGHT + (thickness / 2) - this.PLAYAREA_MARGIN, this.GAME_WIDTH, thickness, WALL_OPTIONS),
			Matter.Bodies.rectangle(this.GAME_WIDTH + (thickness / 2) - this.PLAYAREA_MARGIN, this.GAME_HEIGHT / 2, thickness, this.GAME_HEIGHT, WALL_OPTIONS),
			Matter.Bodies.rectangle(-((thickness / 2) - this.PLAYAREA_MARGIN), this.GAME_HEIGHT / 2, thickness, this.GAME_HEIGHT, WALL_OPTIONS),
		]);
		//#endregion

		this.overflowCollider = Matter.Bodies.rectangle(this.GAME_WIDTH / 2, 0, this.GAME_WIDTH, 200, {
			isStatic: true,
			isSensor: true,
			render: {
				strokeStyle: 'transparent',
				fillStyle: 'transparent',
			},
		});
		Matter.Composite.add(this.engine.world, this.overflowCollider);
	}

	private msToFrame(ms: number) {
		return Math.round(ms / this.TICK_DELTA);
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
		if (this.latestFusionedAt > this.frame - this.COMBO_INTERVAL) {
			this.combo++;
		} else {
			this.combo = 1;
		}
		this.latestFusionedAt = this.frame;

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
				frame: this.frame + this.msToFrame(100),
				callback: () => {
					this.activeBodyIds.push(body.id);
				},
			});

			const comboBonus = 1 + ((this.combo - 1) / 5);
			const additionalScore = Math.round(currentMono.score * comboBonus);
			this.score += additionalScore;

			this.emit('monoAdded', nextMono);
			this.emit('fusioned', newX, newY, additionalScore);

			const panV = newX - this.PLAYAREA_MARGIN;
			const panW = this.GAME_WIDTH - this.PLAYAREA_MARGIN - this.PLAYAREA_MARGIN;
			const pan = ((panV / panW) - 0.5) * 2;
			this.emit('sfx', 'fusion', { volume: 1, pan, pitch: nextMono.sfxPitch });
		} else {
			// nop
		}
	}

	private onCollision(event: Matter.IEventCollision<Matter.Engine>) {
		const minCollisionEnergyForSound = 2.5;
		const maxCollisionEnergyForSound = 9;
		const soundPitchMax = 4;
		const soundPitchMin = 0.5;

		for (const pairs of event.pairs) {
			const { bodyA, bodyB } = pairs;

			if (bodyA.id === this.overflowCollider.id || bodyB.id === this.overflowCollider.id) {
				if (bodyA.id === this.latestDroppedBodyId || bodyB.id === this.latestDroppedBodyId) {
					continue;
				}
				this.gameOver();
				break;
			}

			const shouldFusion = (bodyA.label === bodyB.label) &&
				!this.fusionReservedPairs.some(x =>
					x.bodyA.id === bodyA.id ||
					x.bodyA.id === bodyB.id ||
					x.bodyB.id === bodyA.id ||
					x.bodyB.id === bodyB.id);

			if (shouldFusion) {
				if (this.activeBodyIds.includes(bodyA.id) && this.activeBodyIds.includes(bodyB.id)) {
					this.fusion(bodyA, bodyB);
				} else {
					this.fusionReservedPairs.push({ bodyA, bodyB });
					this.tickCallbackQueue.push({
						frame: this.frame + this.msToFrame(100),
						callback: () => {
							this.fusionReservedPairs = this.fusionReservedPairs.filter(x => x.bodyA.id !== bodyA.id && x.bodyB.id !== bodyB.id);
							this.fusion(bodyA, bodyB);
						},
					});
				}
			} else {
				const energy = pairs.collision.depth;
				if (energy > minCollisionEnergyForSound) {
					const volume = (Math.min(maxCollisionEnergyForSound, energy - minCollisionEnergyForSound) / maxCollisionEnergyForSound) / 4;
					const panV =
						pairs.bodyA.label === '_wall_' ? bodyB.position.x - this.PLAYAREA_MARGIN :
						pairs.bodyB.label === '_wall_' ? bodyA.position.x - this.PLAYAREA_MARGIN :
						((bodyA.position.x + bodyB.position.x) / 2) - this.PLAYAREA_MARGIN;
					const panW = this.GAME_WIDTH - this.PLAYAREA_MARGIN - this.PLAYAREA_MARGIN;
					const pan = ((panV / panW) - 0.5) * 2;
					const pitch = soundPitchMin + ((soundPitchMax - soundPitchMin) * (1 - (Math.min(10, energy) / 10)));
					this.emit('sfx', 'collision', { volume, pan, pitch });
				}
			}
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
		this.emit('gameOver');
	}

	public start() {
		for (let i = 0; i < this.STOCK_MAX; i++) {
			this.stock.push({
				id: this.rng().toString(),
				mono: this.monoDefinitions.filter(x => x.dropCandidate)[Math.floor(this.rng() * this.monoDefinitions.filter(x => x.dropCandidate).length)],
			});
		}
		this.emit('changeStock', this.stock);

		Matter.Events.on(this.engine, 'collisionStart', this.onCollision.bind(this));
	}

	public getLogs() {
		return this.logs;
	}

	public tick() {
		this.frame++;

		if (this.latestFusionedAt < this.frame - this.COMBO_INTERVAL) {
			this.combo = 0;
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

		const hasNextTick = !this.isGameOver;

		return hasNextTick;
	}

	public getActiveMonos() {
		return this.engine.world.bodies.map(x => this.monoDefinitions.find((mono) => mono.id === x.label)!).filter(x => x !== undefined);
	}

	public drop(_x: number) {
		if (this.isGameOver) return;
		// TODO: フレームで計算するようにすればリプレイかどうかのチェックは不要になる
		if (!this.replaying && (Date.now() - this.latestDroppedAt < this.DROP_INTERVAL)) return;

		const head = this.stock.shift()!;
		this.stock.push({
			id: this.rng().toString(),
			mono: this.monoDefinitions.filter(x => x.dropCandidate)[Math.floor(this.rng() * this.monoDefinitions.filter(x => x.dropCandidate).length)],
		});
		this.emit('changeStock', this.stock);

		const inputX = Math.round(_x);
		const x = Math.min(this.GAME_WIDTH - this.PLAYAREA_MARGIN - (head.mono.size / 2), Math.max(this.PLAYAREA_MARGIN + (head.mono.size / 2), inputX));
		const body = this.createBody(head.mono, x, 50 + head.mono.size / 2);
		this.logs.push({
			frame: this.frame,
			operation: 'drop',
			x: inputX,
		});
		Matter.Composite.add(this.engine.world, body);
		this.activeBodyIds.push(body.id);
		this.latestDroppedBodyId = body.id;
		this.latestDroppedAt = Date.now();
		this.emit('dropped', x);
		this.emit('monoAdded', head.mono);
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
	}

	public static serializeLogs(logs: Log[]) {
		const _logs: number[][] = [];

		for (let i = 0; i < logs.length; i++) {
			const log = logs[i];
			const frameDelta = i === 0 ? log.frame : log.frame - logs[i - 1].frame;

			switch (log.operation) {
				case 'drop':
					_logs.push([frameDelta, 0, log.x]);
					break;
				case 'hold':
					_logs.push([frameDelta, 1]);
					break;
				case 'surrender':
					_logs.push([frameDelta, 2]);
					break;
			}
		}

		return _logs;
	}

	public static deserializeLogs(logs: number[][]) {
		const _logs: Log[] = [];

		let frame = 0;

		for (const log of logs) {
			const frameDelta = log[0];
			frame += frameDelta;

			const operation = log[1];

			switch (operation) {
				case 0:
					_logs.push({
						frame,
						operation: 'drop',
						x: log[2],
					});
					break;
				case 1:
					_logs.push({
						frame,
						operation: 'hold',
					});
					break;
				case 2:
					_logs.push({
						frame,
						operation: 'surrender',
					});
					break;
			}
		}

		return _logs;
	}

	public dispose() {
		Matter.World.clear(this.engine.world, false);
		Matter.Engine.clear(this.engine);
	}
}
