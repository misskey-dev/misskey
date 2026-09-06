/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { cm, WORLD_SCALE } from 'misskey-world/src/utility.js';
import { randomRange, Timer } from './utility.js';
import type { EngineBase } from './EngineBase.js';

export class Firework {
	private engine: EngineBase<any>;
	private timer: Timer = new Timer();
	private texturePatterns = [
		{ path: '/client-assets/world/other/firework/flare-glow-1.png', color: new BABYLON.Color3(0.0, 1.0, 0.0) },
		{ path: '/client-assets/world/other/firework/flare-glow-2.png', color: new BABYLON.Color3(0.0, 1.0, 1.0) },
		{ path: '/client-assets/world/other/firework/flare-glow-3.png', color: new BABYLON.Color3(0.0, 0.0, 1.0) },
		{ path: '/client-assets/world/other/firework/flare-glow-4.png', color: new BABYLON.Color3(1.0, 0.0, 1.0) },
		{ path: '/client-assets/world/other/firework/flare-glow-5.png', color: new BABYLON.Color3(1.0, 0.0, 0.0) },
		{ path: '/client-assets/world/other/firework/flare-glow-6.png', color: new BABYLON.Color3(1.0, 0.5, 0.0) },
		{ path: '/client-assets/world/other/firework/flare-glow-7.png', color: new BABYLON.Color3(1.0, 1.0, 0.0) },
		{ path: '/client-assets/world/other/firework/flare-glow-8.png', color: new BABYLON.Color3(0.5, 1.0, 0.0) },
	];
	private RENDERING_GROUP: number;

	constructor(engine: EngineBase<any>, renderingGroup: number) {
		this.engine = engine;
		this.RENDERING_GROUP = renderingGroup;
	}

	public launch(options: {
		position: [number, number, number];
	}) {
		this.engine.sr.disableSnapshotRendering();

		const texturePattern = this.texturePatterns[Math.floor(Math.random() * this.texturePatterns.length)];
		const texture = new BABYLON.Texture(texturePattern.path, this.engine.scene);
		const textureScaleFactor = 3;

		//const emitter = new BABYLON.TransformNode('emitter', this.engine.scene);
		const emitter = BABYLON.MeshBuilder.CreateBox('emitter', { size: cm(10) }, this.engine.scene);
		emitter.isVisible = false;
		emitter.position = new BABYLON.Vector3(options.position[0], options.position[1], options.position[2]);
		const ps = new BABYLON.ParticleSystem('', 32, this.engine.scene);
		ps.renderingGroupId = this.RENDERING_GROUP;
		ps.particleTexture = texture;
		ps.emitter = emitter;
		ps.minEmitPower = cm(100);
		ps.maxEmitPower = cm(500);
		ps.minLifeTime = 0.5;
		ps.maxLifeTime = 1;
		ps.minSize = cm(3) * textureScaleFactor;
		ps.maxSize = cm(30) * textureScaleFactor;
		ps.addDragGradient(0, 0.1);
		ps.addDragGradient(1, 0.8);
		//ps.direction1 = new BABYLON.Vector3(0, 1, 0);
		//ps.direction2 = new BABYLON.Vector3(0, 1, 0);
		ps.emitRate = 30;
		ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
		//ps.color1 = new BABYLON.Color4(1, 1, 1, 0.3);
		//ps.color2 = new BABYLON.Color4(1, 1, 1, 0.2);
		ps.colorDead = new BABYLON.Color4(1, 1, 1, 0);
		ps.start();

		this.engine.sr.fixParticleSystem(ps);

		const launchAnim = new BABYLON.Animation(
			'',
			'position',
			60,
			BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
			BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
		);
		launchAnim.setKeys([
			{ frame: 0, value: new BABYLON.Vector3(options.position[0], options.position[1], options.position[2]) },
			{ frame: 60, value: new BABYLON.Vector3(options.position[0], options.position[1] + cm(randomRange(2000, 6000)), options.position[2]) },
		]);

		emitter.animations.push(launchAnim);
		const animating = Promise.withResolvers<void>();
		this.engine.scene.beginAnimation(emitter, 0, 60, false, 1, () => { animating.resolve(); });
		animating.promise.then(() => {
			ps.stop();

			this.explode({
				position: [emitter.position.x, emitter.position.y, emitter.position.z],
				texture,
				textureScaleFactor,
				color: texturePattern.color,
				callback: () => { // explode途中でSRの状態を切り替えるとパーティクルが消える現象があるため、explodeが終了してから片づける
					this.engine.sr.disableSnapshotRendering();
					ps.dispose();
					emitter.dispose();
					this.engine.sr.enableSnapshotRendering();
				},
			});
		});

		this.engine.sr.enableSnapshotRendering();
	}

	public explode(options: {
		position: [number, number, number];
		texture: BABYLON.Texture;
		textureScaleFactor: number;
		color: BABYLON.Color3;
		callback: () => void;
	}) {
		this.engine.sr.disableSnapshotRendering();

		const pos = new BABYLON.Vector3(options.position[0], options.position[1], options.position[2]);

		const light = new BABYLON.PointLight('', pos, this.engine.scene, true);
		light.range = cm(10000);
		light.radius = cm(50);
		light.intensity = 100000 * WORLD_SCALE * WORLD_SCALE;
		light.diffuse = options.color;
		this.engine.lightContainer.addLight(light);

		const lightAnim = new BABYLON.Animation(
			'',
			'intensity',
			120,
			BABYLON.Animation.ANIMATIONTYPE_FLOAT,
			BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
		);
		lightAnim.setKeys([
			{ frame: 0, value: 100000 * WORLD_SCALE * WORLD_SCALE },
			{ frame: 120, value: 0 },
		]);
		light.animations.push(lightAnim);
		this.engine.scene.beginAnimation(light, 0, 120, false, 1);

		const ps = new BABYLON.ParticleSystem('', 128, this.engine.scene);
		ps.renderingGroupId = this.RENDERING_GROUP;
		ps.particleTexture = options.texture;
		ps.emitter = pos;
		ps.minEmitPower = cm(3700);
		ps.maxEmitPower = cm(4000);
		ps.minLifeTime = 0.8;
		ps.maxLifeTime = 1;
		ps.addDragGradient(0, 0.1);
		ps.addDragGradient(1, 0.8);
		ps.gravity = new BABYLON.Vector3(0, -50, 0).scale(WORLD_SCALE);
		ps.minSize = cm(50) * options.textureScaleFactor;
		ps.maxSize = cm(50) * options.textureScaleFactor;
		const sphereEmitter = ps.createSphereEmitter(cm(1));
		//ps.direction1 = new BABYLON.Vector3(0, 1, 0);
		//ps.direction2 = new BABYLON.Vector3(0, 1, 0);
		ps.manualEmitCount = 100;
		ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_MULTIPLYADD;
		ps.addColorGradient(0.0, new BABYLON.Color4(1, 1, 1, 1));
		ps.addColorGradient(0.7, new BABYLON.Color4(1, 1, 1, 1));
		ps.addColorGradient(1.0, new BABYLON.Color4(1, 1, 1, 0));
		ps.start();

		this.engine.sr.fixParticleSystem(ps);

		this.timer.setTimeout(() => {
			this.engine.sr.disableSnapshotRendering();
			ps.dispose();
			light.dispose();
			this.engine.lightContainer.removeLight(light);
			this.engine.scene.removeLight(light); // lc使用時はsceneには追加してないはずだが、これがないとクラッシュする babylonのバグ？
			this.engine.sr.enableSnapshotRendering();

			options.callback();
		}, 2000);

		this.engine.sr.enableSnapshotRendering();
	}

	public dispose() {
		this.timer.dispose();
	}
}
