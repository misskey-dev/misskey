/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

function seededRandom(seed: number): number {
	return Math.abs(Math.sin(seed) * 10000) % 1;
}

export function createLakeMesh(x: number, z: number, seed: number): THREE.Group {
	const group = new THREE.Group();

	// 湖のサイズ（大きめの楕円）
	const width = 5 + seededRandom(seed) * 4; // 5-9
	const depth = 4 + seededRandom(seed + 1) * 4; // 4-8

	// 水面（CircleGeometryをscaleで楕円化）
	const waterGeo = new THREE.CircleGeometry(width, 48);
	const waterMat = new THREE.MeshStandardMaterial({
		color: 0x0a2a4a,
		transparent: true,
		opacity: 0.85,
		roughness: 0.05,
		metalness: 0.6,
	});
	const water = new THREE.Mesh(waterGeo, waterMat);
	water.rotation.x = -Math.PI / 2; // 水平配置
	water.position.set(0, 0.05, 0);
	water.scale.set(1, depth / width, 1); // Y軸スケールで楕円化
	water.receiveShadow = true;
	water.castShadow = true;
	group.add(water);

	// 浅瀬リング
	const shallowInnerRadius = width * 0.7;
	const shallowOuterRadius = width;
	const shallowGeo = new THREE.RingGeometry(shallowInnerRadius, shallowOuterRadius, 32);
	const shallowMat = new THREE.MeshStandardMaterial({
		color: 0x1a4a6a,
		transparent: true,
		opacity: 0.6,
	});
	const shallow = new THREE.Mesh(shallowGeo, shallowMat);
	shallow.rotation.x = -Math.PI / 2;
	shallow.position.set(0, 0.04, 0);
	shallow.scale.set(1, depth / width, 1); // 楕円化
	shallow.receiveShadow = true;
	group.add(shallow);

	// 縁石（20-30個のDodecahedronGeometry）
	const stoneCount = 20 + Math.floor(seededRandom(seed + 2) * 10); // 20-30
	for (let i = 0; i < stoneCount; i++) {
		const angle = (i / stoneCount) * Math.PI * 2;
		const radiusX = width;
		const radiusZ = depth;
		const stoneX = Math.cos(angle) * radiusX;
		const stoneZ = Math.sin(angle) * radiusZ;
		const stoneSize = 0.2 + seededRandom(seed + 100 + i) * 0.35; // 0.2-0.55

		const stoneGeo = new THREE.DodecahedronGeometry(stoneSize);
		const stoneMat = new THREE.MeshStandardMaterial({ color: 0x3a3a4a });
		const stone = new THREE.Mesh(stoneGeo, stoneMat);
		stone.position.set(stoneX, 0.1, stoneZ);
		stone.castShadow = true;
		stone.receiveShadow = true;
		group.add(stone);
	}

	// 月明かり反射
	const reflectionGeo = new THREE.CircleGeometry(0.8, 20);
	const reflectionMat = new THREE.MeshBasicMaterial({
		color: 0xbbccdd,
		transparent: true,
		opacity: 0.5,
	});
	const reflection = new THREE.Mesh(reflectionGeo, reflectionMat);
	reflection.rotation.x = -Math.PI / 2;
	reflection.position.set(0, 0.06, 0);
	group.add(reflection);

	// 波紋（3個のRingGeometry）
	for (let i = 0; i < 3; i++) {
		const rippleInnerRadius = 0.24 + i * 0.12; // 0.24, 0.36, 0.48
		const rippleOuterRadius = rippleInnerRadius + 0.12; // 0.36, 0.48, 0.6
		const rippleGeo = new THREE.RingGeometry(rippleInnerRadius, rippleOuterRadius, 16);
		const rippleMat = new THREE.MeshBasicMaterial({
			color: 0x3a5a7a,
			transparent: true,
			opacity: 0.3,
		});
		const ripple = new THREE.Mesh(rippleGeo, rippleMat);
		ripple.rotation.x = -Math.PI / 2;
		ripple.position.set(0, 0.055, 0);
		group.add(ripple);
	}

	// 葦（10本のCylinderGeometry）
	for (let i = 0; i < 10; i++) {
		const reedAngle = (i / 10) * Math.PI * 2 + seededRandom(seed + 200 + i) * 0.5;
		const reedRadiusX = width * 0.95;
		const reedRadiusZ = depth * 0.95;
		const reedX = Math.cos(reedAngle) * reedRadiusX;
		const reedZ = Math.sin(reedAngle) * reedRadiusZ;
		const reedRadius = 0.02 + seededRandom(seed + 300 + i) * 0.02; // 0.02-0.04
		const reedHeight = 0.8 + seededRandom(seed + 400 + i) * 0.5; // 0.8-1.3

		const reedGeo = new THREE.CylinderGeometry(reedRadius, reedRadius, reedHeight, 8);
		const reedMat = new THREE.MeshStandardMaterial({ color: 0x2a4a2a });
		const reed = new THREE.Mesh(reedGeo, reedMat);
		reed.position.set(reedX, reedHeight / 2, reedZ);
		reed.castShadow = true;
		reed.receiveShadow = true;
		group.add(reed);
	}

	// 蓮の葉（2-4枚のCircleGeometry + 50%確率で蓮の花）
	const lilyPadCount = 2 + Math.floor(seededRandom(seed + 500) * 2); // 2-4
	for (let i = 0; i < lilyPadCount; i++) {
		const padAngle = seededRandom(seed + 600 + i) * Math.PI * 2;
		const padRadiusX = width * 0.5 * seededRandom(seed + 700 + i);
		const padRadiusZ = depth * 0.5 * seededRandom(seed + 800 + i);
		const padX = Math.cos(padAngle) * padRadiusX;
		const padZ = Math.sin(padAngle) * padRadiusZ;
		const padRadius = 0.3 + seededRandom(seed + 900 + i) * 0.2; // 0.3-0.5

		// 蓮の葉
		const lilyPadGeo = new THREE.CircleGeometry(padRadius, 16);
		const lilyPadMat = new THREE.MeshStandardMaterial({ color: 0x2a5a3a });
		const lilyPad = new THREE.Mesh(lilyPadGeo, lilyPadMat);
		lilyPad.rotation.x = -Math.PI / 2;
		lilyPad.position.set(padX, 0.07, padZ);
		lilyPad.receiveShadow = true;
		group.add(lilyPad);

		// 50%確率で蓮の花
		if (seededRandom(seed + 1000 + i) < 0.5) {
			const flowerGeo = new THREE.SphereGeometry(0.1, 8, 8);
			const flowerMat = new THREE.MeshStandardMaterial({ color: 0xffaacc });
			const flower = new THREE.Mesh(flowerGeo, flowerMat);
			flower.position.set(padX, 0.15, padZ);
			flower.castShadow = true;
			group.add(flower);
		}
	}

	// グループ位置設定
	group.position.set(x, 0, z);

	return group;
}
