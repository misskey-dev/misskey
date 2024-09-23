/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'eventemitter3';
import * as Matter from 'matter-js';
import seedrandom from 'seedrandom';
import { NORAML_MONOS, SQUARE_MONOS, SWEETS_MONOS, YEN_MONOS } from './monos.js';

export type Mono = {
	id: string;
	level: number;
	sizeX: number;
	sizeY: number;
	shape: 'circle' | 'rectangle' | 'custom';
	vertices?: Matter.Vector[][];
	verticesSize?: number;
	score: number;
	dropCandidate: boolean;
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
	fusioned: (x: number, y: number, nextMono: Mono | null, scoreDelta: number) => void;
	collision: (energy: number, bodyA: Matter.Body, bodyB: Matter.Body) => void;
	monoAdded: (mono: Mono) => void;
	gameOver: () => void;
}> {
	private PHYSICS_QUALITY_FACTOR = 16; // 低いほどパフォーマンスが高いがガタガタして安定しなくなる、逆に高すぎても何故か不安定になる
	private COMBO_INTERVAL = 60; // frame
	public readonly GAME_VERSION = 3;
	public readonly GAME_WIDTH = 450;
	public readonly GAME_HEIGHT = 600;
	public readonly DROP_COOLTIME = 30; // frame
	public readonly PLAYAREA_MARGIN = 25;
	private STOCK_MAX = 4;
	private TICK_DELTA = 1000 / 60; // 60fps

	public frame = 0;
	public engine: Matter.Engine;
	private tickCallbackQueue: { frame: number; callback: () => void; }[] = [];
	private overflowCollider: Matter.Body;
	private isGameOver = false;
	private gameMode: 'normal' | 'yen' | 'square' | 'sweets' | 'space';
	private rng: () => number;
	private logs: Log[] = [];

	/**
	 * フィールドに出ていて、かつ合体の対象となるアイテム
	 */
	private fusionReadyBodyIds: Matter.Body['id'][] = [];

	private gameOverReadyBodyIds: Matter.Body['id'][] = [];

	/**
	 * fusion予約アイテムのペア
	 * TODO: これらのモノは光らせるなどの演出をすると視覚的に楽しそう
	 */
	private fusionReservedPairs: { bodyA: Matter.Body; bodyB: Matter.Body }[] = [];

	private latestDroppedAt = 0; // frame
	private latestFusionedAt = 0; // frame
	private stock: { id: string; mono: Mono }[] = [];
	private holding: { id: string; mono: Mono } | null = null;

	public get monoDefinitions() {
		switch (this.gameMode) {
			case 'normal': return NORAML_MONOS;
			case 'yen': return YEN_MONOS;
			case 'square': return SQUARE_MONOS;
			case 'sweets': return SWEETS_MONOS;
			case 'space': return NORAML_MONOS;
		}
	}

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

	private getMonoRenderOptions: null | ((mono: Mono) => Partial<Matter.IBodyRenderOptions>) = null;

	public replayPlaybackRate = 1;

	constructor(env: {
		seed: string;
		gameMode: DropAndFusionGame['gameMode'];
		getMonoRenderOptions?: (mono: Mono) => Partial<Matter.IBodyRenderOptions>;
	}) {
		super();

		//#region BIND
		this.tick = this.tick.bind(this);
		//#endregion

		this.gameMode = env.gameMode;
		this.getMonoRenderOptions = env.getMonoRenderOptions ?? null;
		this.rng = seedrandom(env.seed);

		// sweetsモードは重いため
		const physicsQualityFactor = this.gameMode === 'sweets' ? 4 : this.PHYSICS_QUALITY_FACTOR;
		this.engine = Matter.Engine.create({
			constraintIterations: 2 * physicsQualityFactor,
			positionIterations: 6 * physicsQualityFactor,
			velocityIterations: 4 * physicsQualityFactor,
			gravity: {
				x: 0,
				y: this.gameMode === 'space' ? 0.0125 : 1,
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
			slop: this.gameMode === 'space' ? 0.01 : 0.7,
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
			label: '_overflow_',
			isStatic: true,
			isSensor: true,
			render: {
				strokeStyle: 'transparent',
				fillStyle: 'transparent',
			},
		});
		Matter.Composite.add(this.engine.world, this.overflowCollider);
	}

	public msToFrame(ms: number) {
		return Math.round(ms / this.TICK_DELTA);
	}

	public frameToMs(frame: number) {
		return frame * this.TICK_DELTA;
	}

	private createBody(mono: Mono, x: number, y: number) {
		const options: Matter.IBodyDefinition = {
			label: mono.id,
			density: this.gameMode === 'space' ? 0.01 : ((mono.sizeX * mono.sizeY) / 10000),
			restitution: this.gameMode === 'space' ? 0.5 : 0.2,
			frictionAir: this.gameMode === 'space' ? 0 : 0.01,
			friction: this.gameMode === 'space' ? 0.5 : 0.7,
			frictionStatic: this.gameMode === 'space' ? 0 : 5,
			slop: this.gameMode === 'space' ? 0.01 : 0.7,
			//mass: 0,
			render: this.getMonoRenderOptions ? this.getMonoRenderOptions(mono) : undefined,
		};
		if (mono.shape === 'circle') {
			return Matter.Bodies.circle(x, y, mono.sizeX / 2, options);
		} else if (mono.shape === 'rectangle') {
			return Matter.Bodies.rectangle(x, y, mono.sizeX, mono.sizeY, options);
		} else if (mono.shape === 'custom' && mono.vertices != null && mono.verticesSize != null) { //eslint-disable-line @typescript-eslint/no-unnecessary-condition
			return Matter.Bodies.fromVertices(x, y, mono.vertices.map(i => i.map(j => ({
				x: (j.x / mono.verticesSize!) * mono.sizeX, //eslint-disable-line @typescript-eslint/no-non-null-assertion
				y: (j.y / mono.verticesSize!) * mono.sizeY, //eslint-disable-line @typescript-eslint/no-non-null-assertion
			}))), options);
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

		const newX = (bodyA.position.x + bodyB.position.x) / 2;
		const newY = (bodyA.position.y + bodyB.position.y) / 2;

		this.fusionReadyBodyIds = this.fusionReadyBodyIds.filter(x => x !== bodyA.id && x !== bodyB.id);
		this.gameOverReadyBodyIds = this.gameOverReadyBodyIds.filter(x => x !== bodyA.id && x !== bodyB.id);
		Matter.Composite.remove(this.engine.world, [bodyA, bodyB]);

		const currentMono = this.monoDefinitions.find(y => y.id === bodyA.label);

		if (currentMono == null) {
			throw new Error('Current Mono Not Found');
		}

		const nextMono = this.monoDefinitions.find(x => x.level === currentMono.level + 1) ?? null;

		if (nextMono) {
			const body = this.createBody(nextMono, newX, newY);
			Matter.Composite.add(this.engine.world, body);

			// 連鎖してfusionした場合の分かりやすさのため少し間を置いてからfusion対象になるようにする
			this.tickCallbackQueue.push({
				frame: this.frame + this.msToFrame(100),
				callback: () => {
					this.fusionReadyBodyIds.push(body.id);
				},
			});

			this.emit('monoAdded', nextMono);
		}

		const hasComboBonus = this.gameMode !== 'yen' && this.gameMode !== 'sweets';
		const comboBonus = hasComboBonus ? 1 + ((this.combo - 1) / 5) : 1;
		const additionalScore = Math.round(currentMono.score * comboBonus);
		this.score += additionalScore;

		this.emit('fusioned', newX, newY, nextMono, additionalScore);
	}

	private onCollision(event: Matter.IEventCollision<Matter.Engine>) {
		for (const pairs of event.pairs) {
			const { bodyA, bodyB } = pairs;

			const shouldFusion = (bodyA.label === bodyB.label) &&
				!this.fusionReservedPairs.some(x =>
					x.bodyA.id === bodyA.id ||
					x.bodyA.id === bodyB.id ||
					x.bodyB.id === bodyA.id ||
					x.bodyB.id === bodyB.id);

			if (shouldFusion) {
				if (this.fusionReadyBodyIds.includes(bodyA.id) && this.fusionReadyBodyIds.includes(bodyB.id)) {
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

				if (bodyA.label === '_overflow_' || bodyB.label === '_overflow_') continue;

				if (bodyA.label !== '_wall_' && bodyB.label !== '_wall_') {
					if (!this.gameOverReadyBodyIds.includes(bodyA.id)) this.gameOverReadyBodyIds.push(bodyA.id);
					if (!this.gameOverReadyBodyIds.includes(bodyB.id)) this.gameOverReadyBodyIds.push(bodyB.id);
				}

				this.emit('collision', energy, bodyA, bodyB);
			}
		}
	}

	private onCollisionActive(event: Matter.IEventCollision<Matter.Engine>) {
		for (const pairs of event.pairs) {
			const { bodyA, bodyB } = pairs;

			// ハコからあふれたかどうかの判定
			if (bodyA.id === this.overflowCollider.id || bodyB.id === this.overflowCollider.id) {
				if (this.gameOverReadyBodyIds.includes(bodyA.id) || this.gameOverReadyBodyIds.includes(bodyB.id)) {
					this.gameOver();
					break;
				}
				continue;
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
		Matter.Events.on(this.engine, 'collisionActive', this.onCollisionActive.bind(this));
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
		return this.engine.world.bodies
			.map(x => this.monoDefinitions.find((mono) => mono.id === x.label))
			.filter(x => x !== undefined);
	}

	public drop(_x: number) {
		if (this.isGameOver) return;
		if (this.frame - this.latestDroppedAt < this.DROP_COOLTIME) return;

		const head = this.stock.shift();
		if (!head) return;

		this.stock.push({
			id: this.rng().toString(),
			mono: this.monoDefinitions.filter(x => x.dropCandidate)[Math.floor(this.rng() * this.monoDefinitions.filter(x => x.dropCandidate).length)],
		});
		this.emit('changeStock', this.stock);

		const inputX = Math.round(_x);
		const x = Math.min(this.GAME_WIDTH - this.PLAYAREA_MARGIN - (head.mono.sizeX / 2), Math.max(this.PLAYAREA_MARGIN + (head.mono.sizeX / 2), inputX));
		const body = this.createBody(head.mono, x, 50 + head.mono.sizeY / 2);
		this.logs.push({
			frame: this.frame,
			operation: 'drop',
			x: inputX,
		});

		// add force
		if (this.gameMode === 'space') {
			Matter.Body.applyForce(body, body.position, {
				x: 0,
				y: (Math.PI * head.mono.sizeX * head.mono.sizeY) / 65536,
			});
		}

		Matter.Composite.add(this.engine.world, body);

		this.fusionReadyBodyIds.push(body.id);
		this.latestDroppedAt = this.frame;

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
			const head = this.stock.shift();
			if (!head) return;
			this.stock.unshift(this.holding);
			this.holding = head;
			this.emit('changeHolding', this.holding);
			this.emit('changeStock', this.stock);
		} else {
			const head = this.stock.shift();
			if (!head) return;
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
