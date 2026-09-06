/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { registerBabylonRuntime } from '../src/babylonRuntime.js';

test('registers the Babylon outline renderer for pure runtime scenes', () => {
	registerBabylonRuntime();
	const engine = new BABYLON.NullEngine();
	const scene = new BABYLON.Scene(engine);
	let outlineRenderer: BABYLON.OutlineRenderer | null = null;

	try {
		try {
			outlineRenderer = scene.getOutlineRenderer();
		} catch {
		}

		expect(outlineRenderer).toBeInstanceOf(BABYLON.OutlineRenderer);
	} finally {
		scene.dispose();
		engine.dispose();
	}
});
