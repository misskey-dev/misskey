/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

// 仕様: 神社ワールド用3Dオブジェクト
// G = グリッドサイズ（0.5単位 = 通常のノクタウンスケールの半分）
// 注意: 以前はG=32だったが、ノクタウンのスケールに合わせてG=0.5に修正

const G = 0.5;

// マテリアルキャッシュ
const materials = {
	vermillion: new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.7 }),
	black: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 }),
	gold: new THREE.MeshStandardMaterial({ color: 0xdaa520, roughness: 0.3, metalness: 0.6 }),
	stone: new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.9 }),
	wood: new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.8 }),
	darkWood: new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.8, side: THREE.DoubleSide }),
	white: new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.6 }),
	grass: new THREE.MeshStandardMaterial({ color: 0x3d8b3d, roughness: 0.9 }),
	gravel: new THREE.MeshStandardMaterial({ color: 0xb8a88a, roughness: 1 }),
	roof: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, side: THREE.DoubleSide }),
	rope: new THREE.MeshStandardMaterial({ color: 0xf5e6c8, roughness: 0.9 }),
};

/**
 * 鳥居を作成
 * 仕様: 朱色の鳥居（柱・笠木・島木・貫・額束）
 */
export function createTorii(x: number, z: number, scale = 1): THREE.Group {
	const g = new THREE.Group();
	const s = scale;

	// 柱
	const pillarGeo = new THREE.CylinderGeometry(G * 0.6 * s, G * 0.8 * s, G * 12 * s, 20);
	const pillarL = new THREE.Mesh(pillarGeo, materials.vermillion);
	pillarL.position.set(-G * 4.5 * s, G * 6 * s, 0);
	pillarL.castShadow = true;
	g.add(pillarL);

	const pillarR = new THREE.Mesh(pillarGeo, materials.vermillion);
	pillarR.position.set(G * 4.5 * s, G * 6 * s, 0);
	pillarR.castShadow = true;
	g.add(pillarR);

	// 台座
	const baseGeo = new THREE.CylinderGeometry(G * 1 * s, G * 1.2 * s, G * 0.6 * s, 20);
	[-4.5, 4.5].forEach(px => {
		const base = new THREE.Mesh(baseGeo, materials.stone);
		base.position.set(px * G * s, G * 0.3 * s, 0);
		base.castShadow = true;
		g.add(base);
	});

	// 笠木（上、黒）
	const kasagi = new THREE.Mesh(
		new THREE.BoxGeometry(G * 14 * s, G * 1.2 * s, G * 2 * s),
		materials.black,
	);
	kasagi.position.set(0, G * 13 * s, 0);
	kasagi.castShadow = true;
	g.add(kasagi);

	// 笠木の両端
	[-7.5, 7.5].forEach(px => {
		const tip = new THREE.Mesh(
			new THREE.BoxGeometry(G * 1.2 * s, G * 1.8 * s, G * 2.2 * s),
			materials.black,
		);
		tip.position.set(px * G * s, G * 13.3 * s, 0);
		tip.rotation.z = px > 0 ? 0.2 : -0.2;
		tip.castShadow = true;
		g.add(tip);
	});

	// 島木（朱色）
	const shimagi = new THREE.Mesh(
		new THREE.BoxGeometry(G * 12 * s, G * 0.9 * s, G * 1.5 * s),
		materials.vermillion,
	);
	shimagi.position.set(0, G * 11.8 * s, 0);
	shimagi.castShadow = true;
	g.add(shimagi);

	// 貫
	const nuki = new THREE.Mesh(
		new THREE.BoxGeometry(G * 11 * s, G * 0.7 * s, G * 1 * s),
		materials.vermillion,
	);
	nuki.position.set(0, G * 9 * s, 0);
	nuki.castShadow = true;
	g.add(nuki);

	// 額束（白い看板）
	const gaku = new THREE.Mesh(
		new THREE.BoxGeometry(G * 2.5 * s, G * 2 * s, G * 0.3 * s),
		materials.white,
	);
	gaku.position.set(0, G * 10.4 * s, 0);
	g.add(gaku);

	g.position.set(x, 0, z);
	return g;
}

/**
 * 賽銭箱を作成
 * 仕様: クリック可能な賽銭箱オブジェクト
 */
export function createSaisenBox(x: number, z: number): THREE.Group {
	const g = new THREE.Group();

	// 本体
	const body = new THREE.Mesh(
		new THREE.BoxGeometry(G * 4, G * 2.5, G * 3),
		materials.darkWood,
	);
	body.position.y = G * 1.25;
	body.castShadow = true;
	g.add(body);

	// 上部の格子
	const topFrame = new THREE.Mesh(
		new THREE.BoxGeometry(G * 4.2, G * 0.3, G * 3.2),
		materials.wood,
	);
	topFrame.position.y = G * 2.65;
	topFrame.castShadow = true;
	g.add(topFrame);

	// 格子の縦棒
	for (let i = -1.5; i <= 1.5; i += 0.6) {
		const bar = new THREE.Mesh(
			new THREE.BoxGeometry(G * 0.1, G * 0.1, G * 2.8),
			materials.wood,
		);
		bar.position.set(i * G, G * 2.65, 0);
		g.add(bar);
	}

	// 金属の縁取り
	const rim = new THREE.Mesh(
		new THREE.BoxGeometry(G * 4.3, G * 0.2, G * 3.3),
		materials.gold,
	);
	rim.position.y = G * 2.8;
	g.add(rim);

	// 脚
	[[-1.6, -1.2], [1.6, -1.2], [-1.6, 1.2], [1.6, 1.2]].forEach(([lx, lz]) => {
		const leg = new THREE.Mesh(
			new THREE.BoxGeometry(G * 0.4, G * 0.8, G * 0.4),
			materials.darkWood,
		);
		leg.position.set(lx * G, -G * 0.4, lz * G);
		leg.castShadow = true;
		g.add(leg);
	});

	g.position.set(x, 0, z);
	g.userData.clickable = true;
	g.userData.type = 'saisen';
	return g;
}

/**
 * 鈴（スズ）を作成
 * 仕様: クリックでアニメーション可能な鈴
 */
export function createSuzu(x: number, z: number): THREE.Group {
	const g = new THREE.Group();

	// 綱（縄）
	const ropeGeo = new THREE.CylinderGeometry(G * 0.15, G * 0.2, G * 6, 12);
	const rope = new THREE.Mesh(ropeGeo, materials.rope);
	rope.position.y = G * 5;
	g.add(rope);

	// 綱の房（下部）
	const tassels: THREE.Mesh[] = [];
	for (let i = 0; i < 8; i++) {
		const tassel = new THREE.Mesh(
			new THREE.CylinderGeometry(G * 0.05, G * 0.08, G * 1.5, 8),
			materials.rope,
		);
		const angle = (i / 8) * Math.PI * 2;
		tassel.position.set(Math.cos(angle) * G * 0.3, G * 1.5, Math.sin(angle) * G * 0.3);
		tassels.push(tassel);
		g.add(tassel);
	}

	// 鈴本体
	const bellBody = new THREE.Mesh(
		new THREE.SphereGeometry(G * 1.2, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.7),
		materials.gold,
	);
	bellBody.position.y = G * 8;
	bellBody.rotation.x = Math.PI;
	bellBody.castShadow = true;
	g.add(bellBody);

	// 鈴の上部（取り付け部）
	const bellTop = new THREE.Mesh(
		new THREE.CylinderGeometry(G * 0.4, G * 0.6, G * 0.5, 16),
		materials.gold,
	);
	bellTop.position.y = G * 8.5;
	g.add(bellTop);

	// 鈴の舌（中の振り子）
	const clapper = new THREE.Mesh(
		new THREE.SphereGeometry(G * 0.3, 12, 12),
		materials.gold,
	);
	clapper.position.y = G * 7.3;
	g.add(clapper);

	g.position.set(x, 0, z);
	g.userData.clickable = true;
	g.userData.type = 'suzu';
	g.userData.tassels = tassels;
	return g;
}

/**
 * 鈴を揺らすアニメーション
 * 仕様: bellRingイベント受信時に呼び出される
 */
export function animateSuzu(suzuGroup: THREE.Group, duration = 1500): void {
	const startTime = Date.now();
	const originalRotation = suzuGroup.rotation.z;

	function animate(): void {
		const elapsed = Date.now() - startTime;
		const progress = elapsed / duration;

		if (progress >= 1) {
			suzuGroup.rotation.z = originalRotation;
			return;
		}

		// 減衰振動
		const amplitude = 0.3 * (1 - progress);
		const frequency = 15;
		suzuGroup.rotation.z = originalRotation + Math.sin(progress * frequency * Math.PI) * amplitude;

		requestAnimationFrame(animate);
	}

	animate();
}

/**
 * 拝殿を作成
 * 仕様: 神社の本殿（簡略化版）
 */
export function createHaiden(x: number, z: number): THREE.Group {
	const h = new THREE.Group();

	// 基壇（階段状）
	for (let i = 0; i < 3; i++) {
		const step = new THREE.Mesh(
			new THREE.BoxGeometry(G * (20 - i * 2), G * 1, G * (16 - i * 1.5)),
			materials.stone,
		);
		step.position.set(0, G * (0.5 + i), -i * G * 0.3);
		step.castShadow = true;
		step.receiveShadow = true;
		h.add(step);
	}

	// 正面階段
	for (let i = 0; i < 4; i++) {
		const stair = new THREE.Mesh(
			new THREE.BoxGeometry(G * 6, G * 0.5, G * 1),
			materials.stone,
		);
		stair.position.set(0, G * (2 - i * 0.5), G * (6 + i));
		stair.castShadow = true;
		h.add(stair);
	}

	// 床（朱色）
	const floor = new THREE.Mesh(
		new THREE.BoxGeometry(G * 16, G * 0.4, G * 12),
		materials.vermillion,
	);
	floor.position.set(0, G * 3.5, 0);
	floor.receiveShadow = true;
	h.add(floor);

	// 柱（朱色）
	const pillarGeo = new THREE.CylinderGeometry(G * 0.4, G * 0.4, G * 6, 16);
	const pillarPositions = [
		[-7, 5], [7, 5], [-7, -5], [7, -5], [0, 5], [-7, 0], [7, 0],
	];
	pillarPositions.forEach(([px, pz]) => {
		const pillar = new THREE.Mesh(pillarGeo, materials.vermillion);
		pillar.position.set(px * G, G * 6.7, pz * G);
		pillar.castShadow = true;
		h.add(pillar);
	});

	// 壁（白）
	const backWall = new THREE.Mesh(
		new THREE.BoxGeometry(G * 14, G * 5, G * 0.3),
		materials.white,
	);
	backWall.position.set(0, G * 6.2, -G * 5.5);
	backWall.castShadow = true;
	h.add(backWall);

	// 側壁
	[-7.5, 7.5].forEach(px => {
		const sideWall = new THREE.Mesh(
			new THREE.BoxGeometry(G * 0.3, G * 5, G * 10),
			materials.white,
		);
		sideWall.position.set(px * G, G * 6.2, 0);
		sideWall.castShadow = true;
		h.add(sideWall);
	});

	// 屋根（切妻造り - 簡略化）
	const roofW = G * 10;
	const roofH = G * 5;
	const roofD = G * 8;
	const roofY = G * 9.7;

	// 左側の屋根面
	const leftRoofGeo = new THREE.BufferGeometry();
	const leftVerts = new Float32Array([
		-roofW - G * 2, roofY, roofD,
		0, roofY + roofH, roofD,
		-roofW - G * 2, roofY, -roofD - G * 2,
		0, roofY + roofH, roofD,
		0, roofY + roofH, -roofD - G * 2,
		-roofW - G * 2, roofY, -roofD - G * 2,
	]);
	leftRoofGeo.setAttribute('position', new THREE.BufferAttribute(leftVerts, 3));
	leftRoofGeo.computeVertexNormals();
	const leftRoof = new THREE.Mesh(leftRoofGeo, materials.roof);
	leftRoof.castShadow = true;
	h.add(leftRoof);

	// 右側の屋根面
	const rightRoofGeo = new THREE.BufferGeometry();
	const rightVerts = new Float32Array([
		roofW + G * 2, roofY, roofD,
		roofW + G * 2, roofY, -roofD - G * 2,
		0, roofY + roofH, roofD,
		0, roofY + roofH, roofD,
		roofW + G * 2, roofY, -roofD - G * 2,
		0, roofY + roofH, -roofD - G * 2,
	]);
	rightRoofGeo.setAttribute('position', new THREE.BufferAttribute(rightVerts, 3));
	rightRoofGeo.computeVertexNormals();
	const rightRoof = new THREE.Mesh(rightRoofGeo, materials.roof);
	rightRoof.castShadow = true;
	h.add(rightRoof);

	// 棟（屋根の頂上）
	const ridge = new THREE.Mesh(
		new THREE.BoxGeometry(G * 0.8, G * 0.6, roofD * 2 + G * 4),
		materials.gold,
	);
	ridge.position.set(0, roofY + roofH + G * 0.2, -G);
	ridge.castShadow = true;
	h.add(ridge);

	h.position.set(x, 0, z);
	return h;
}

/**
 * 神社ワールドの地面を作成
 * 仕様: mapSizeは半径（中心から端までの距離）、地面は-mapSizeからmapSizeまでをカバー
 */
export function createShrineGround(mapSize: number): THREE.Group {
	const ground = new THREE.Group();

	// 草地（mapSize * 2 の正方形）
	const grassGeo = new THREE.PlaneGeometry(mapSize * 2, mapSize * 2);
	const grass = new THREE.Mesh(grassGeo, materials.grass);
	grass.rotation.x = -Math.PI / 2;
	grass.receiveShadow = true;
	ground.add(grass);

	// 参道（砂利道）
	// 仕様: スポーン位置(z=100)から拝殿(z=-20)までをカバー
	// 長さ130、中心z=40で z=-25 から z=105 をカバー
	// Y=0.3: Zファイティング（フリッカー）防止のため草地より十分上に配置
	const pathLength = 130;
	const pathWidth = 6;
	const pathGeo = new THREE.PlaneGeometry(pathWidth, pathLength);
	const path = new THREE.Mesh(pathGeo, materials.gravel);
	path.rotation.x = -Math.PI / 2;
	path.position.set(0, 0.3, 40); // 中心 z=40、Y=0.3でフリッカー防止
	path.receiveShadow = true;
	ground.add(path);

	return ground;
}

/**
 * 神社ワールド全体を構築
 * 仕様: 境内はXZ (0,0) を入口として配置、Zが正面
 */
// 仕様: FR-018a 神社ワールドの配置（0,0,0中心）
// - プレイヤーのスポーン・帰還ゲート: (0,0,57)に統一（ワープゲートの上にスポーン）
// - 鳥居: z=50, 35, 20（参道に3つ、間隔を詰めて配置）
// - 賽銭箱: z=-8（拝殿の手前）
// - 鈴: z=-15（拝殿の軒下）
// - 拝殿: z=-20（奥）
export function buildShrineWorld(): {
	scene: THREE.Group;
	saisenBox: THREE.Group;
	suzu: THREE.Group;
	clickableObjects: THREE.Object3D[];
} {
	const scene = new THREE.Group();
	const clickableObjects: THREE.Object3D[] = [];

	// 地面（半径150 = -150から150をカバー、スポーン位置z=100を含む）
	const ground = createShrineGround(150);
	scene.add(ground);

	// 鳥居（参道に3つ配置）- 間隔を詰めてコンパクトに
	scene.add(createTorii(0, 50, 1)); // 入口側（最大）
	scene.add(createTorii(0, 35, 0.9)); // 中間
	scene.add(createTorii(0, 20, 0.85)); // 拝殿側（最小）

	// 拝殿（神社本殿）- コンパクトに配置
	const haiden = createHaiden(0, -20);
	scene.add(haiden);

	// 賽銭箱 - 拝殿の手前
	const saisenBox = createSaisenBox(0, -8);
	scene.add(saisenBox);
	clickableObjects.push(saisenBox);

	// 鈴 - 拝殿の軒下
	const suzu = createSuzu(0, -15);
	scene.add(suzu);
	clickableObjects.push(suzu);

	return {
		scene,
		saisenBox,
		suzu,
		clickableObjects,
	};
}
