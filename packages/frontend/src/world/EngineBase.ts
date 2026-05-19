/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import EventEmitter from 'eventemitter3';

export type EngineBaseEvents = {
	'loadingProgress': (ctx: { progress: number }) => void;
};

export abstract class EngineBase<EVs extends EngineBaseEvents> extends EventEmitter<{
	'ev': (ctx: { type: keyof EVs; ctx: Parameters<EVs[keyof EVs]>[0] }) => void;
}> {
	protected engine: BABYLON.WebGPUEngine;
	protected scene: BABYLON.Scene;
	protected fps: number | null = null;
	protected disposed = false;

	public inputs: EventEmitter<{
		'click': (event: { x: number; y: number; }) => void;
		'keydown': (event: { code: string; shiftKey: boolean; }) => void;
		'keyup': (event: { code: string; shiftKey: boolean; }) => void;
		'wheel': (event: { deltaY: number; }) => void;
		'zoom': (event: { delta: number; }) => void;
		'pointer': (event: { x: number; y: number; }) => void;
	}> = new EventEmitter();

	constructor(options: {
		engine: BABYLON.WebGPUEngine;
		fps: number | null;
	}) {
		super();

		this.fps = options.fps;

		this.engine = options.engine;
		this.scene = new BABYLON.Scene(this.engine);
	}

	private currentRafId: number | null = null;

	private startRenderLoop() {
		if (this.fps == null) {
			this.engine.runRenderLoop(() => {
				this.scene.render();
			});
		} else {
			let then = 0;
			const interval = 1000 / this.fps;

			const renderLoop = (timeStamp: number) => {
				if (this.disposed) return;

				// workerで実行される可能性がある
				this.currentRafId = requestAnimationFrame(renderLoop);

				const delta = timeStamp - then;
				if (delta <= interval) return;
				then = timeStamp - (delta % interval);

				this.engine.beginFrame();
				this.scene.render();
				this.engine.endFrame();
			};

			// workerで実行される可能性がある
			this.currentRafId = requestAnimationFrame(renderLoop);
		}
	}

	public pauseRender() { // TODO: srと同じく参照カウント方式にした方が便利そう
		this.engine.stopRenderLoop();
		if (this.currentRafId != null) {
			// workerで実行される可能性がある
			cancelAnimationFrame(this.currentRafId);
			this.currentRafId = null;
		}
	}

	public resumeRender() {
		this.startRenderLoop();
	}

	public abstract init(): Promise<void>;

	protected ev<K extends keyof EVs>(type: K, ctx: Parameters<EVs[K]>[0]) {
		this.emit('ev', { type, ctx });
	}

	public abstract resize(): void;

	public destroy() {
		this.engine.stopRenderLoop();
		if (this.currentRafId != null) {
			// workerで実行される可能性がある
			cancelAnimationFrame(this.currentRafId);
			this.currentRafId = null;
		}
		this.engine.dispose();
		this.scene.dispose();
		this.disposed = true;
	}
}
