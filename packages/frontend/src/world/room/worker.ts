/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { RoomEngine } from './engine.js';
import type { RoomState } from './engine.js';

let engine: RoomEngine | null = null;
let canvas: HTMLCanvasElement | null = null;

onmessage = async (event) => {
	//console.log('Worker received message:', event.data);

	switch (event.data?.type) {
		case 'init': {
			const roomState = event.data.roomState as RoomState;
			canvas = event.data.canvas as HTMLCanvasElement;
			const babylonEngine = new BABYLON.WebGPUEngine(canvas, { doNotHandleContextLost: true });
			babylonEngine.compatibilityMode = false;
			babylonEngine.enableOfflineSupport = false;
			await babylonEngine.initAsync();
			engine = new RoomEngine(roomState, { canvas, engine: babylonEngine });
			await engine.init();
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
		default: {
			console.warn('Unrecognized message type:', event.data?.type);
		}
	}
};
