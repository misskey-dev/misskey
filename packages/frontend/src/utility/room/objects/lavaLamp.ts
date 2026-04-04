/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const lavaLamp = defineObject({
	id: 'lavaLamp',
	name: 'Lava Lamp',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	createInstance: ({ room, scene, root }) => {
		return {
			onInited: () => {
				const light = new BABYLON.PointLight('lavaLampLight', new BABYLON.Vector3(0, 11/*cm*/, 0), scene, true);
				light.parent = root;
				light.diffuse = new BABYLON.Color3(1.0, 0.5, 0.2);
				light.intensity = 300;
				light.range = 100/*cm*/;
				room.lightContainer.addLight(light);

				const sphere = BABYLON.MeshBuilder.CreateSphere('lavaLampLightSphere', { diameter: 4/*cm*/ }, scene);
				sphere.parent = root;
				sphere.position = new BABYLON.Vector3(0, 15/*cm*/, 0);
				const mat = new BABYLON.StandardMaterial('lavaLampLightMat', scene);
				mat.emissiveColor = new BABYLON.Color3(1.0, 0.5, 0.2);

				mat.alpha = 0.5;
				//mat.disableLighting = true;
				sphere.material = mat;

				const anim = new BABYLON.Animation('lavaLampLightAnim', 'position.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
				anim.setKeys([
					{ frame: 0, value: 11/*cm*/ },
					{ frame: 500, value: 38/*cm*/ },
				]);
				sphere.animations = [anim];
				scene.beginAnimation(sphere, 0, 500, true);

				const emitter = new BABYLON.TransformNode('emitter', scene);
				emitter.parent = root;
				emitter.position = new BABYLON.Vector3(0, 10/*cm*/, 0);
				const ps = new BABYLON.ParticleSystem('', 32, scene);
				ps.particleTexture = new BABYLON.Texture('/client-assets/room/objects/lava-lamp/bubble.png');
				ps.emitter = emitter;
				ps.isLocal = true;
				ps.minEmitBox = new BABYLON.Vector3(-1/*cm*/, 0, -1/*cm*/);
				ps.maxEmitBox = new BABYLON.Vector3(1/*cm*/, 0, 1/*cm*/);
				ps.minEmitPower = 2;
				ps.maxEmitPower = 3;
				ps.minLifeTime = 9;
				ps.maxLifeTime = 9;
				ps.minSize = 0.5/*cm*/;
				ps.maxSize = 1/*cm*/;
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
