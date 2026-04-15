/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as BABYLON from '@babylonjs/core';
import { defineObject, WORLD_SCALE } from '../engine.js';
import { cm } from '../utility.js';

export const lavaLamp = defineObject({
	id: 'lavaLamp',
	name: 'Lava Lamp',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: false,
	createInstance: ({ room, scene, root }) => {
		return {
			onInited: () => {
				const light = new BABYLON.PointLight('lavaLampLight', new BABYLON.Vector3(0, cm(11), 0), scene, room?.lightContainer != null);
				light.parent = root;
				light.diffuse = new BABYLON.Color3(1.0, 0.5, 0.2);
				light.intensity = 0.03 * WORLD_SCALE * WORLD_SCALE;
				light.range = cm(100);
				if (room?.lightContainer != null) room.lightContainer.addLight(light);

				const sphere = BABYLON.MeshBuilder.CreateSphere('lavaLampLightSphere', { diameter: cm(4) }, scene);
				sphere.parent = root;
				sphere.position = new BABYLON.Vector3(0, cm(15), 0);
				const mat = new BABYLON.StandardMaterial('lavaLampLightMat', scene);
				mat.emissiveColor = new BABYLON.Color3(1.0, 0.5, 0.2);

				mat.alpha = 0.5;
				//mat.disableLighting = true;
				sphere.material = mat;

				const anim = new BABYLON.Animation('lavaLampLightAnim', 'position.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
				anim.setKeys([
					{ frame: 0, value: cm(11) },
					{ frame: 500, value: cm(38) },
				]);
				sphere.animations = [anim];
				scene.beginAnimation(sphere, 0, 500, true);

				const emitter = new BABYLON.TransformNode('emitter', scene);
				emitter.parent = root;
				emitter.position = new BABYLON.Vector3(0, cm(10), 0);
				const ps = new BABYLON.ParticleSystem('', 32, scene);
				ps.particleTexture = new BABYLON.Texture('/client-assets/room/objects/lava-lamp/bubble.png');
				ps.emitter = emitter;
				ps.isLocal = true;
				ps.minEmitBox = new BABYLON.Vector3(cm(-1), 0, cm(-1));
				ps.maxEmitBox = new BABYLON.Vector3(cm(1), 0, cm(1));
				ps.minEmitPower = 2;
				ps.maxEmitPower = 3;
				ps.minLifeTime = 9;
				ps.maxLifeTime = 9;
				ps.minSize = cm(0.5);
				ps.maxSize = cm(1);
				ps.direction1 = new BABYLON.Vector3(0, 1, 0);
				ps.direction2 = new BABYLON.Vector3(0, 1, 0);
				ps.emitRate = 1;
				ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
				ps.color1 = new BABYLON.Color4(1, 1, 1, 0.3);
				ps.color2 = new BABYLON.Color4(1, 1, 1, 0.2);
				ps.colorDead = new BABYLON.Color4(1, 1, 1, 0);
				ps.preWarmCycles = Math.random() * 1000;
				ps.start();
			},
			interactions: {},
		};
	},

});
