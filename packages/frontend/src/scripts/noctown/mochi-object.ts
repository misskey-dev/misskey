/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

// 仕様: FR-015 鏡餅3Dオブジェクト
// specs/008-noctown-shrine/mochi.html の仕様に準拠
// 賽銭報酬として獲得できる設置可能アイテム

// マテリアル
const materials = {
	wood: new THREE.MeshStandardMaterial({
		color: 0x8b4513,
		roughness: 0.7,
		metalness: 0.1,
	}),
	paper: new THREE.MeshStandardMaterial({
		color: 0xffffff,
		roughness: 0.9,
	}),
	redEdge: new THREE.MeshStandardMaterial({
		color: 0xcc2222,
		roughness: 0.8,
	}),
	leaf: new THREE.MeshStandardMaterial({
		color: 0x2d5a27,
		roughness: 0.8,
		side: THREE.DoubleSide,
	}),
	mochi: new THREE.MeshStandardMaterial({
		color: 0xfff8f0,
		roughness: 0.4,
		metalness: 0.0,
	}),
	orange: new THREE.MeshStandardMaterial({
		color: 0xff8c00,
		roughness: 0.7,
		metalness: 0.0,
	}),
	stem: new THREE.MeshStandardMaterial({
		color: 0x4a3728,
		roughness: 0.9,
	}),
	orangeLeaf: new THREE.MeshStandardMaterial({
		color: 0x228b22,
		roughness: 0.6,
		side: THREE.DoubleSide,
	}),
};

// 仕様: 餅のプロファイル曲線を生成
function createMochiProfile(rTop: number, rBottom: number, h: number): THREE.Vector2[] {
	const points: THREE.Vector2[] = [];
	const steps = 20;

	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const y = t * h;

		// 滑らかな曲線で餅の形状を作成
		const bulge = Math.sin(t * Math.PI);
		const taper = 1 - t * (1 - rTop / rBottom);
		const r = rBottom * taper * (1 + bulge * 0.15);

		points.push(new THREE.Vector2(r, y));
	}

	return points;
}

// 仕様: 三方（さんぽう）- 台座を作成
function createSanpo(s: number): THREE.Group {
	const group = new THREE.Group();

	// 上部の台
	const topGeom = new THREE.BoxGeometry(2.2 * s, 0.15 * s, 2.2 * s);
	const top = new THREE.Mesh(topGeom, materials.wood);
	top.position.y = 0.5 * s;
	top.castShadow = true;
	top.receiveShadow = true;
	group.add(top);

	// 脚部（前後左右の4つの板）
	const legThickness = 0.08 * s;
	const legHeight = 0.42 * s;

	// 左右の脚
	const sideLegGeom = new THREE.BoxGeometry(legThickness, legHeight, 1.8 * s);
	[-1.0, 1.0].forEach(x => {
		const leg = new THREE.Mesh(sideLegGeom, materials.wood);
		leg.position.set(x * s, 0.21 * s + legHeight / 2, 0);
		leg.castShadow = true;
		group.add(leg);
	});

	// 前後の脚
	const frontBackLegGeom = new THREE.BoxGeometry(1.8 * s, legHeight, legThickness);
	[-0.9, 0.9].forEach(z => {
		const leg = new THREE.Mesh(frontBackLegGeom, materials.wood);
		leg.position.set(0, 0.21 * s + legHeight / 2, z * s);
		leg.castShadow = true;
		group.add(leg);
	});

	// 底板
	const bottomGeom = new THREE.BoxGeometry(2.0 * s, 0.1 * s, 1.8 * s);
	const bottom = new THREE.Mesh(bottomGeom, materials.wood);
	bottom.position.y = 0.05 * s;
	bottom.castShadow = true;
	group.add(bottom);

	return group;
}

// 仕様: 四方紅（しほうべに）- 赤い縁の紙を作成
function createShihoubeni(s: number): THREE.Group {
	const group = new THREE.Group();

	// 白い紙
	const paperGeom = new THREE.BoxGeometry(2.0 * s, 0.02 * s, 2.0 * s);
	const paper = new THREE.Mesh(paperGeom, materials.paper);
	paper.receiveShadow = true;
	group.add(paper);

	// 赤い縁
	const edgeThickness = 0.15 * s;
	const edges = [
		{ size: [2.0 * s, 0.025 * s, edgeThickness], pos: [0, 0.01 * s, 0.925 * s] },
		{ size: [2.0 * s, 0.025 * s, edgeThickness], pos: [0, 0.01 * s, -0.925 * s] },
		{ size: [edgeThickness, 0.025 * s, 1.7 * s], pos: [0.925 * s, 0.01 * s, 0] },
		{ size: [edgeThickness, 0.025 * s, 1.7 * s], pos: [-0.925 * s, 0.01 * s, 0] },
	];

	edges.forEach(edge => {
		const geom = new THREE.BoxGeometry(edge.size[0], edge.size[1], edge.size[2]);
		const mesh = new THREE.Mesh(geom, materials.redEdge);
		mesh.position.set(edge.pos[0], edge.pos[1], edge.pos[2]);
		group.add(mesh);
	});

	return group;
}

// 仕様: 裏白（うらじろ）- シダの葉を作成
function createUrajiro(s: number): THREE.Group {
	const group = new THREE.Group();

	function createLeaf(angle: number, scale: number): THREE.Group {
		const leafGroup = new THREE.Group();

		// 葉の形状
		const leafShape = new THREE.Shape();
		leafShape.moveTo(0, 0);
		leafShape.quadraticCurveTo(0.3 * s * scale, 0.5 * s * scale, 0.15 * s * scale, 1.2 * s * scale);
		leafShape.quadraticCurveTo(0, 1.4 * s * scale, -0.15 * s * scale, 1.2 * s * scale);
		leafShape.quadraticCurveTo(-0.3 * s * scale, 0.5 * s * scale, 0, 0);

		const leafGeom = new THREE.ShapeGeometry(leafShape);
		const leaf = new THREE.Mesh(leafGeom, materials.leaf);
		leaf.rotation.x = -Math.PI / 2 + 0.3;
		leafGroup.add(leaf);

		leafGroup.rotation.y = angle;
		return leafGroup;
	}

	for (let i = 0; i < 8; i++) {
		const angle = (i / 8) * Math.PI * 2;
		const leaf = createLeaf(angle, 0.8 + Math.random() * 0.2);
		leaf.position.y = 0.02 * s;
		group.add(leaf);
	}

	return group;
}

// 仕様: 餅を作成（LatheGeometryで滑らかな形状）
function createMochi(radiusTop: number, radiusBottom: number, height: number, yPos: number, s: number): THREE.Group {
	const group = new THREE.Group();
	const segments = 32;

	const profile = createMochiProfile(radiusTop * s, radiusBottom * s, height * s);
	const geometry = new THREE.LatheGeometry(profile, segments);

	const mochi = new THREE.Mesh(geometry, materials.mochi);
	mochi.castShadow = true;
	mochi.receiveShadow = true;
	group.add(mochi);

	// 上面の蓋
	const topRadius = profile[profile.length - 1].x;
	const topCapGeom = new THREE.CircleGeometry(topRadius, segments);
	const topCap = new THREE.Mesh(topCapGeom, materials.mochi);
	topCap.rotation.x = -Math.PI / 2;
	topCap.position.y = height * s;
	topCap.castShadow = true;
	group.add(topCap);

	// 底面の蓋
	const bottomRadius = profile[0].x;
	const bottomCapGeom = new THREE.CircleGeometry(bottomRadius, segments);
	const bottomCap = new THREE.Mesh(bottomCapGeom, materials.mochi);
	bottomCap.rotation.x = Math.PI / 2;
	bottomCap.position.y = 0;
	bottomCap.receiveShadow = true;
	group.add(bottomCap);

	group.position.y = yPos * s;
	return group;
}

// 仕様: みかん（橙）を作成
function createDaidai(s: number): THREE.Group {
	const group = new THREE.Group();

	// みかん本体
	const orangeGeom = new THREE.SphereGeometry(0.35 * s, 32, 32);
	orangeGeom.scale(1, 0.8, 1);
	const orange = new THREE.Mesh(orangeGeom, materials.orange);
	orange.castShadow = true;
	group.add(orange);

	// へた
	const stemGeom = new THREE.CylinderGeometry(0.03 * s, 0.05 * s, 0.1 * s, 8);
	const stem = new THREE.Mesh(stemGeom, materials.stem);
	stem.position.y = 0.28 * s;
	group.add(stem);

	// 葉っぱ
	function createOrangeLeaf(rotY: number, rotZ: number): THREE.Mesh {
		const leafShape = new THREE.Shape();
		leafShape.moveTo(0, 0);
		leafShape.quadraticCurveTo(0.15 * s, 0.15 * s, 0.1 * s, 0.35 * s);
		leafShape.quadraticCurveTo(0, 0.4 * s, -0.1 * s, 0.35 * s);
		leafShape.quadraticCurveTo(-0.15 * s, 0.15 * s, 0, 0);

		const leafGeom = new THREE.ShapeGeometry(leafShape);
		const leaf = new THREE.Mesh(leafGeom, materials.orangeLeaf);
		leaf.position.y = 0.3 * s;
		leaf.rotation.set(-0.3, rotY, rotZ);
		return leaf;
	}

	group.add(createOrangeLeaf(0.3, 0.5));
	group.add(createOrangeLeaf(-0.3, -0.5));

	return group;
}

// 仕様: 御幣（ごへい）- 紙垂を作成
function createGohei(s: number): THREE.Group {
	const group = new THREE.Group();

	function createShide(xOffset: number): THREE.Group {
		const shideGroup = new THREE.Group();

		// 紙垂の形状
		const shape = new THREE.Shape();
		shape.moveTo(0, 0);
		shape.lineTo(0.15 * s, 0);
		shape.lineTo(0.15 * s, -0.3 * s);
		shape.lineTo(0.05 * s, -0.3 * s);
		shape.lineTo(0.05 * s, -0.1 * s);
		shape.lineTo(0, -0.1 * s);
		shape.closePath();

		const geom = new THREE.ShapeGeometry(shape);

		for (let i = 0; i < 3; i++) {
			const shide = new THREE.Mesh(geom, materials.paper);
			shide.position.y = -i * 0.25 * s;
			shide.position.x = (i % 2) * 0.1 * s;
			shideGroup.add(shide);
		}

		shideGroup.position.x = xOffset;
		return shideGroup;
	}

	group.add(createShide(-0.2 * s));
	group.add(createShide(0.2 * s));

	return group;
}

/**
 * 鏡餅を作成
 * 仕様: FR-015 specs/008-noctown-shrine/mochi.html に準拠
 * 三方（台座）+ 四方紅（赤い縁の紙）+ 裏白（シダの葉）+ 2段の餅 + 御幣 + みかん
 */
export function createKagamiMochi(scale = 1): THREE.Group {
	const group = new THREE.Group();
	const s = scale;

	// 三方（台座）
	const sanpo = createSanpo(s);
	group.add(sanpo);

	// 四方紅（赤い縁の紙）
	const shihoubeni = createShihoubeni(s);
	shihoubeni.position.y = 0.58 * s;
	group.add(shihoubeni);

	// 裏白（シダの葉）
	const urajiro = createUrajiro(s);
	urajiro.position.y = 0.6 * s;
	group.add(urajiro);

	// 下の餅（大きい方）
	const bottomMochi = createMochi(0.7, 0.85, 0.5, 0.65, s);
	group.add(bottomMochi);

	// 上の餅（小さい方）
	const topMochi = createMochi(0.5, 0.65, 0.4, 1.15, s);
	group.add(topMochi);

	// 御幣（紙垂）
	const gohei = createGohei(s);
	gohei.position.set(0, 1.55 * s, 0.3 * s);
	group.add(gohei);

	// みかん（橙）
	const daidai = createDaidai(s);
	daidai.position.y = 1.7 * s;
	group.add(daidai);

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
