/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { RoomObjectPreviewEngine } from './previewEngine.js';

let engine: RoomObjectPreviewEngine | null = null;
let canvas: OffscreenCanvas | null = null;

onmessage = async (event) => {
	//console.log('Worker received message:', event.data);

	switch (event.data?.type) {
		case 'init': {
			canvas = event.data.canvas as OffscreenCanvas;
			const babylonEngine = new BABYLON.WebGPUEngine(canvas, { doNotHandleContextLost: true, powerPreference: 'low-power', antialias: true });
			babylonEngine.compatibilityMode = false;
			babylonEngine.enableOfflineSupport = false;
			await babylonEngine.initAsync();
			if (event.data.options.resolution === 2) babylonEngine.setHardwareScalingLevel(0.5);
			if (event.data.options.resolution === 0.5) babylonEngine.setHardwareScalingLevel(2);

			engine = new RoomObjectPreviewEngine({
				engine: babylonEngine,
				...event.data.options,
			});

			engine.on('ev', ({ type, ctx }) => {
				self.postMessage({ type: 'ev', ev: { type, ctx } });
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
		case 'input:keydown': {
			if (engine == null) break;
			engine.inputs.emit('keydown', event.data.ev);
			break;
		}
		case 'input:keyup': {
			if (engine == null) break;
			engine.inputs.emit('keyup', event.data.ev);
			break;
		}
		case 'input:click': {
			if (engine == null) break;
			engine.inputs.emit('click', event.data.ev);
			break;
		}
		case 'input:wheel': {
			if (engine == null) break;
			engine.inputs.emit('wheel', event.data.ev);
			break;
		}
		case 'call': {
			if (engine != null) {
				const res = engine[event.data.fn](...(event.data.args ?? []));
				if (event.data.needReturnValue) {
					if (res instanceof Promise) {
						res.then((r) => {
							self.postMessage({ type: 'return', id: event.data.id, value: r });
						});
					} else {
						self.postMessage({ type: 'return', id: event.data.id, value: res });
					}
				}
			}
			break;
		}
		case 'set': {
			if (engine != null) engine[event.data.key] = event.data.value;
			break;
		}
		default: {
			console.warn('Unrecognized message type:', event.data?.type);
		}
	}
};
