/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure';
import EventEmitter from 'eventemitter3';

const IN_WEB_WORKER = typeof window === 'undefined';

export type EngineBaseEvents = {
	'loadingProgress': (ctx: { progress: number }) => void;
	'contextlost': (ctx: { reason: string; message: string; }) => void;
};

export abstract class EngineBase<EVs extends EngineBaseEvents> extends EventEmitter<{
	'ev': (ctx: { type: keyof EVs; ctx: Parameters<EVs[keyof EVs]>[0] }) => void;
}> {
	declare _eventTypes?: EVs;

	protected engine: BABYLON.WebGPUEngine;
	public scene: BABYLON.Scene;
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
		// doNotHandleContextLostがtrueだとそもそも呼ばれない
		//babylonEngine.onContextLostObservable.add(() => {
		//	os.alert({
		//		type: 'error',
		//		title: i18n.ts.somethingHappened,
		//		text: i18n.ts._miWorld.crushed_description,
		//	});
		//});
		this.engine._device.lost.then((info) => { // TODO: babylonEngineの内部プロパティに依存しない方法をforumで聞く
			this.ev('contextlost', { reason: info.reason, message: info.message }); // transferableじゃないデータが含まれている可能性も考慮してinfoそのままは送らない
		});

		this.scene = new BABYLON.Scene(this.engine);

		if (!IN_WEB_WORKER) {
			(window as any).showBabylonInspector = () => {
				import('@babylonjs/inspector').then(({ ShowInspector }) => {
					ShowInspector(this.scene);
				});
			};
		}
	}

	private currentRafId: number | null = null;

	protected startRenderLoop() {
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

	public async takeScreenshot() {
		return await BABYLON.Tools.CreateScreenshotAsync(this.engine, this.scene.activeCamera!, { precision: 1 });
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
