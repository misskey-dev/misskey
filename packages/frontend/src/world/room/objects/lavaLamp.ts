/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { cm, WORLD_SCALE } from '../../utility.js';

export const lavaLamp = defineObject({
	id: 'lavaLamp',
	name: 'Lava Lamp',
	options: {
		schema: {
			bodyColor: {
				type: 'color',
				label: 'Body color',
			},
			glassColor: {
				type: 'color',
				label: 'Glass color',
			},
			lightColor: {
				type: 'color',
				label: 'Light color',
			},
		},
		default: {
			bodyColor: [0.8, 0.8, 0.8],
			glassColor: [0.8, 0, 0.1],
			lightColor: [1, 0.175, 0.175],
		},
	},
	placement: 'top',
	hasCollisions: false,
	canPreMeshesMerging: true,
	createInstance: ({ options, room, scene, root, model }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');
		const glassMaterial = model.findMaterial('__X_GLASS__');
		const lightMaterial = model.findMaterial('__X_LIGHT__');

		const applyBodyColor = () => {
			const [r, g, b] = options.bodyColor;
			bodyMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyBodyColor();

		const applyGlassColor = () => {
			const [r, g, b] = options.glassColor;
			glassMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyGlassColor();

		const applyLightColor = () => {
			const [r, g, b] = options.lightColor;
			lightMaterial.emissiveColor = new BABYLON.Color3(r, g, b);
		};

		applyLightColor();

		return {
			onInited: () => {
				const light = new BABYLON.PointLight('lavaLampLight', new BABYLON.Vector3(0, cm(11), 0), scene, room?.lightContainer != null);
				light.parent = root;
				light.diffuse = new BABYLON.Color3(1.0, 0.5, 0.2);
				light.intensity = 0.03 * WORLD_SCALE * WORLD_SCALE;
				light.range = cm(100);
				if (room?.lightContainer != null) room.lightContainer.addLight(light);

				const mat = new BABYLON.PBRMaterial('lavaLampLightMat', scene);
				mat.emissiveColor = new BABYLON.Color3(1.0, 0.5, 0.2);
				mat.disableLighting = true;
				const sphere = BABYLON.MeshBuilder.CreateSphere('lavaLampLightSphere', { diameter: cm(4) }, scene);
				sphere.parent = root;
				sphere.position = new BABYLON.Vector3(0, cm(15), 0);
				sphere.material = mat;
				const sphere2 = BABYLON.MeshBuilder.CreateSphere('lavaLampLightSphere2', { diameter: cm(2) }, scene);
				sphere2.parent = root;
				sphere2.position = new BABYLON.Vector3(0, cm(15), 0);
				sphere2.material = mat;

				const anim = new BABYLON.Animation('lavaLampLightAnim', 'position.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
				anim.setKeys([
					{ frame: 0, value: cm(11) },
					{ frame: 500, value: cm(38) },
				]);
				sphere.animations = [anim];
				scene.beginAnimation(sphere, 0, 500, true);
				sphere2.animations = [anim];
				scene.beginAnimation(sphere2, 0, 500, true, 0.6);

				const emitter = new BABYLON.TransformNode('emitter', scene);
				emitter.parent = root;
				emitter.position = new BABYLON.Vector3(0, cm(10), 0);
				const ps = new BABYLON.ParticleSystem('', 32, scene);
				ps.particleTexture = new BABYLON.Texture('/client-assets/room/objects/lava-lamp/bubble.png');
				ps.emitter = emitter;
				ps.isLocal = true;
				ps.minEmitBox = new BABYLON.Vector3(cm(-1), 0, cm(-1));
				ps.maxEmitBox = new BABYLON.Vector3(cm(1), 0, cm(1));
				ps.minEmitPower = cm(2);
				ps.maxEmitPower = cm(3);
				ps.minLifeTime = 10;
				ps.maxLifeTime = 10;
				ps.minSize = cm(0.5);
				ps.maxSize = cm(1.25);
				ps.direction1 = new BABYLON.Vector3(0, 1, 0);
				ps.direction2 = new BABYLON.Vector3(0, 1, 0);
				ps.emitRate = 1;
				ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
				ps.color1 = new BABYLON.Color4(1, 1, 1, 1);
				ps.color2 = new BABYLON.Color4(1, 1, 1, 0.75);
				ps.colorDead = new BABYLON.Color4(1, 1, 1, 0);
				ps.preWarmCycles = Math.random() * 1000;
				ps.start();
			},
			interactions: {},
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'bodyColor': applyBodyColor(); break;
					case 'glassColor': applyGlassColor(); break;
					case 'lightColor': applyLightColor(); break;
				}
			},
		};
	},

});
