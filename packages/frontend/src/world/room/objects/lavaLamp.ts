/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { cm, WORLD_SCALE } from '../../utility.js';
import { getLightRangeFactorByGraphicsQuality } from '../utility.js';

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
			lavaColor: {
				type: 'color',
				label: 'Lava color',
			},
		},
		default: {
			bodyColor: [0.8, 0.8, 0.8],
			glassColor: [0.8, 0, 0.1],
			lightColor: [1, 0.175, 0.175],
			lavaColor: [1, 0.5, 0.2],
		},
	},
	placement: 'top',
	hasCollisions: false,
	canPreMeshesMerging: true,
	createInstance: ({ options, room, scene, sr, root, model, graphicsQuality }) => {
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

		// TODO: graphicsQualityがLOWならそもそも追加しない
		const light = new BABYLON.PointLight('lavaLampLight', new BABYLON.Vector3(0, cm(11), 0), scene, room?.lightContainer != null);
		light.parent = root;
		light.intensity = 0.03 * WORLD_SCALE * WORLD_SCALE;
		light.range = cm(50) * getLightRangeFactorByGraphicsQuality(graphicsQuality);
		light.radius = cm(5);
		if (room?.lightContainer != null) room.lightContainer.addLight(light);

		const applyLightColor = () => {
			const [r, g, b] = options.lightColor;
			lightMaterial.emissiveColor = new BABYLON.Color3(r, g, b);
			light.diffuse = new BABYLON.Color3(r, g, b);
		};

		applyLightColor();

		const lavaMat = new BABYLON.PBRMaterial('lavaLampLightMat', scene);
		lavaMat.disableLighting = true;
		const sphere = BABYLON.MeshBuilder.CreateSphere('lavaLampLightSphere', { diameter: cm(4) }, scene);
		sphere.parent = root;
		sphere.position = new BABYLON.Vector3(0, cm(15), 0);
		sphere.material = lavaMat;
		const sphere2 = BABYLON.MeshBuilder.CreateSphere('lavaLampLightSphere2', { diameter: cm(3) }, scene);
		sphere2.parent = root;
		sphere2.position = new BABYLON.Vector3(0, cm(15), 0);
		sphere2.material = lavaMat;
		const sphere3 = BABYLON.MeshBuilder.CreateSphere('lavaLampLightSphere3', { diameter: cm(2) }, scene);
		sphere3.parent = root;
		sphere3.position = new BABYLON.Vector3(0, cm(15), 0);
		sphere3.material = lavaMat;

		const applyLavaColor = () => {
			const [r, g, b] = options.lavaColor;
			lavaMat.emissiveColor = new BABYLON.Color3(r, g, b);
		};

		applyLavaColor();

		let animationObserver: BABYLON.Observer<BABYLON.Scene>;

		const anim = new BABYLON.Animation('lavaLampLightAnim', 'position.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
		anim.setKeys([
			{ frame: 0, value: cm(11) },
			{ frame: 800, value: cm(38) },
		]);
		sphere.animations = [anim];
		scene.beginAnimation(sphere, 0, 800, true);
		sphere2.animations = [anim];
		scene.beginAnimation(sphere2, 0, 800, true, 0.65);
		sphere3.animations = [anim];
		scene.beginAnimation(sphere3, 0, 800, true, 0.6);

		animationObserver = scene.onAfterAnimationsObservable.add(() => {
			sr.updateMesh([sphere, sphere2, sphere3], false);
		});

		const emitter = new BABYLON.TransformNode('emitter', scene);
		emitter.parent = root;
		emitter.position = new BABYLON.Vector3(0, cm(10), 0);
		const ps = new BABYLON.ParticleSystem('', 32, scene);
		ps.particleTexture = new BABYLON.Texture('/client-assets/room/objects/lava-lamp/bubble.png');
		ps.emitter = emitter;
		ps.isLocal = true;
		ps.minEmitBox = new BABYLON.Vector3(cm(-1), 0, cm(-1));
		ps.maxEmitBox = new BABYLON.Vector3(cm(1), 0, cm(1));
		ps.minEmitPower = cm(1);
		ps.maxEmitPower = cm(2.5);
		ps.minLifeTime = 12;
		ps.maxLifeTime = 12;
		ps.minSize = cm(0.25);
		ps.maxSize = cm(1.25);
		ps.direction1 = new BABYLON.Vector3(0, 1, 0);
		ps.direction2 = new BABYLON.Vector3(0, 1, 0);
		ps.emitRate = 1;
		ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
		ps.color1 = new BABYLON.Color4(1, 1, 1, 1);
		ps.color2 = new BABYLON.Color4(1, 1, 1, 0.75);
		ps.colorDead = new BABYLON.Color4(1, 1, 1, 0);
		ps.preWarmCycles = 100;
		ps.start();

		sr.fixParticleSystem(ps);

		return {
			onInited: () => {

			},
			interactions: {},
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'bodyColor': applyBodyColor(); break;
					case 'glassColor': applyGlassColor(); break;
					case 'lightColor': applyLightColor(); break;
					case 'lavaColor': applyLavaColor(); break;
				}
			},
			dispose: () => {
				if (animationObserver != null) {
					scene.onAfterAnimationsObservable.remove(animationObserver);
				}
			},
		};
	},
});
