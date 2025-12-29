/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

// 仕様: 鏡餅3Dオブジェクト
// 賽銭報酬として獲得できる設置可能アイテム

const G = 32;

// マテリアル
const materials = {
	mochi: new THREE.MeshStandardMaterial({
		color: 0xfff8e7,
		roughness: 0.4,
		metalness: 0.0,
	}),
	orange: new THREE.MeshStandardMaterial({
		color: 0xff8c00,
		roughness: 0.6,
		metalness: 0.0,
	}),
	leaf: new THREE.MeshStandardMaterial({
		color: 0x228b22,
		roughness: 0.7,
		side: THREE.DoubleSide,
	}),
	stem: new THREE.MeshStandardMaterial({
		color: 0x2e8b57,
		roughness: 0.8,
	}),
	stand: new THREE.MeshStandardMaterial({
		color: 0x8b0000,
		roughness: 0.5,
	}),
	gold: new THREE.MeshStandardMaterial({
		color: 0xffd700,
		roughness: 0.3,
		metalness: 0.5,
	}),
};

/**
 * 鏡餅を作成
 * 仕様: 2段重ねの餅 + みかん + 葉 + 台座
 */
export function createKagamiMochi(scale = 1): THREE.Group {
	const group = new THREE.Group();
	const s = scale;

	// 台座（三宝）
	const standBase = new THREE.Mesh(
		new THREE.BoxGeometry(G * 1.2 * s, G * 0.15 * s, G * 1.2 * s),
		materials.stand,
	);
	standBase.position.y = G * 0.075 * s;
	standBase.castShadow = true;
	group.add(standBase);

	// 台座の足
	const legGeo = new THREE.BoxGeometry(G * 0.15 * s, G * 0.3 * s, G * 0.15 * s);
	[
		[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4],
	].forEach(([lx, lz]) => {
		const leg = new THREE.Mesh(legGeo, materials.stand);
		leg.position.set(lx * G * s, -G * 0.15 * s, lz * G * s);
		leg.castShadow = true;
		group.add(leg);
	});

	// 台座の縁（金色）
	const rimGeo = new THREE.BoxGeometry(G * 1.3 * s, G * 0.05 * s, G * 1.3 * s);
	const rim = new THREE.Mesh(rimGeo, materials.gold);
	rim.position.y = G * 0.175 * s;
	group.add(rim);

	// 敷き紙（白い四角）
	const paper = new THREE.Mesh(
		new THREE.BoxGeometry(G * 1.1 * s, G * 0.02 * s, G * 1.1 * s),
		new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }),
	);
	paper.position.y = G * 0.21 * s;
	group.add(paper);

	// 下の餅（大きい方）
	const bottomMochi = new THREE.Mesh(
		new THREE.SphereGeometry(G * 0.5 * s, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6),
		materials.mochi,
	);
	bottomMochi.scale.y = 0.5;
	bottomMochi.position.y = G * 0.35 * s;
	bottomMochi.castShadow = true;
	group.add(bottomMochi);

	// 上の餅（小さい方）
	const topMochi = new THREE.Mesh(
		new THREE.SphereGeometry(G * 0.35 * s, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6),
		materials.mochi,
	);
	topMochi.scale.y = 0.5;
	topMochi.position.y = G * 0.55 * s;
	topMochi.castShadow = true;
	group.add(topMochi);

	// みかん（橙）
	const orange = new THREE.Mesh(
		new THREE.SphereGeometry(G * 0.18 * s, 12, 12),
		materials.orange,
	);
	orange.position.y = G * 0.75 * s;
	orange.castShadow = true;
	group.add(orange);

	// みかんのヘタ
	const stem = new THREE.Mesh(
		new THREE.CylinderGeometry(G * 0.02 * s, G * 0.03 * s, G * 0.05 * s, 8),
		materials.stem,
	);
	stem.position.y = G * 0.92 * s;
	group.add(stem);

	// 葉っぱ（橙の葉）
	const leafGeo = new THREE.BufferGeometry();
	const leafVerts = new Float32Array([
		0, 0, 0,
		G * 0.15 * s, G * 0.08 * s, 0,
		G * 0.08 * s, G * 0.15 * s, 0,
	]);
	leafGeo.setAttribute('position', new THREE.BufferAttribute(leafVerts, 3));
	leafGeo.computeVertexNormals();

	const leaf1 = new THREE.Mesh(leafGeo, materials.leaf);
	leaf1.position.set(-G * 0.08 * s, G * 0.88 * s, 0);
	leaf1.rotation.z = 0.3;
	group.add(leaf1);

	const leaf2 = new THREE.Mesh(leafGeo, materials.leaf);
	leaf2.position.set(G * 0.08 * s, G * 0.88 * s, 0);
	leaf2.rotation.z = -0.3;
	leaf2.rotation.y = Math.PI;
	group.add(leaf2);

	group.userData.itemType = 'mochi';
	return group;
}

/**
 * 設置された鏡餅を作成
 * 仕様: PlacedItem用の鏡餅オブジェクト
 */
export function createPlacedMochi(
	position: { x: number; y: number; z: number },
	rotation: number = 0,
	scale: number = 0.8,
): THREE.Group {
	const mochi = createKagamiMochi(scale);
	mochi.position.set(position.x, position.y, position.z);
	mochi.rotation.y = rotation;
	return mochi;
}

/**
 * 獲得エフェクト付きの鏡餅を表示
 * 仕様: 賽銭完了時のトースト表示用
 */
export function createMochiRewardEffect(count: number): THREE.Group {
	const group = new THREE.Group();

	// 複数個の場合は横に並べる
	const spacing = 1.5;
	const startX = -((count - 1) * spacing) / 2;

	for (let i = 0; i < Math.min(count, 5); i++) {
		const mochi = createKagamiMochi(0.5);
		mochi.position.x = startX + i * spacing;
		group.add(mochi);
	}

	// 5個以上の場合は「+n」テキストを表示（実装は省略）
	if (count > 5) {
		// テキストスプライトなどで「+n」を表示
	}

	return group;
}
