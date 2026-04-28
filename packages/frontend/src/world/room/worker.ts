/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { GRAPHICS_QUALITY_MEDIUM, RoomEngine } from './engine.js';
import type { RoomState } from './engine.js';

let engine: RoomEngine | null = null;
let canvas: HTMLCanvasElement | null = null;

onmessage = async (event) => {
	//console.log('Worker received message:', event.data);

	switch (event.data?.type) {
		case 'init': {
			const roomState = event.data.roomState as RoomState;
			canvas = event.data.canvas as HTMLCanvasElement;
			const babylonEngine = new BABYLON.WebGPUEngine(canvas, { doNotHandleContextLost: true, powerPreference: 'high-performance', antialias: event.data.options.graphicsQuality >= GRAPHICS_QUALITY_MEDIUM });
			babylonEngine.compatibilityMode = false;
			babylonEngine.enableOfflineSupport = false;
			await babylonEngine.initAsync();
			if (event.data.options.resolution === 2) babylonEngine.setHardwareScalingLevel(0.5);
			if (event.data.options.resolution === 0.5) babylonEngine.setHardwareScalingLevel(2);

			engine = new RoomEngine(roomState, {
				canvas,
				engine: babylonEngine,
				...event.data.options,
			});

			engine.on('loadingProgress', ({ progress }) => {
				self.postMessage({ type: 'progress', progress });
			});

			await engine.init();

			self.postMessage({ type: 'inited' });
			break;
		}
		case 'resize': {
			canvas.width = event.data.width;
			canvas.height = event.data.height;
			if (engine != null) engine.resize();
			break;
		}
		case 'dom:keydown': {
			if (engine == null) break;
			engine.scene.onKeyboardObservable.notifyObservers({ type: BABYLON.KeyboardEventTypes.KEYDOWN, event: event.data.ev });
			break;
		}
		case 'dom:keyup': {
			if (engine == null) break;
			engine.scene.onKeyboardObservable.notifyObservers({ type: BABYLON.KeyboardEventTypes.KEYUP, event: event.data.ev });
			break;
		}
		case 'dom:pointerdown': {
			if (engine == null) break;
			event.data.ev.preventDefault = () => {};
			event.data.ev.stopPropagation = () => {};
			engine.scene.onPointerObservable.notifyObservers({ type: BABYLON.PointerEventTypes.POINTERDOWN, event: event.data.ev });
			break;
		}
		case 'call': {
			if (engine != null) engine[event.data.fn](...event.data.args);
			break;
		}
		default: {
			console.warn('Unrecognized message type:', event.data?.type);
		}
	}
};
