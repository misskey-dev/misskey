import * as THREE from 'three';

function seededRandom(seed: number): number {
	return Math.abs(Math.sin(seed) * 10000) % 1;
}

export function createPondMesh(x: number, z: number, seed: number): THREE.Group {
	const group = new THREE.Group();

	// 池のサイズ（横長）
	const width = 3.5 + seededRandom(seed) * 2; // 3.5-5.5
	const depth = 2 + seededRandom(seed + 1) * 1; // 2-3

	// 水面（CircleGeometryをscaleで楕円化）
	const waterGeo = new THREE.CircleGeometry(width, 32);
	const waterMat = new THREE.MeshStandardMaterial({
		color: 0x1a3a5a,
		transparent: true,
		opacity: 0.85,
		roughness: 0.1,
		metalness: 0.5,
	});
	const water = new THREE.Mesh(waterGeo, waterMat);
	water.rotation.x = -Math.PI / 2; // 水平配置
	water.position.set(0, 0.05, 0);
	water.scale.set(1, depth / width, 1); // Y軸スケールで楕円化
	water.receiveShadow = true;
	water.castShadow = true;
	group.add(water);

	// 縁石（12-20個のSphereGeometry）
	const stoneCount = 12 + Math.floor(seededRandom(seed + 2) * 8); // 12-20
	for (let i = 0; i < stoneCount; i++) {
		const angle = (i / stoneCount) * Math.PI * 2;
		const radiusX = width;
		const radiusZ = depth;
		const stoneX = Math.cos(angle) * radiusX;
		const stoneZ = Math.sin(angle) * radiusZ;
		const stoneSize = 0.15 + seededRandom(seed + 100 + i) * 0.2; // 0.15-0.35

		const stoneGeo = new THREE.SphereGeometry(stoneSize, 8, 8);
		const stoneMat = new THREE.MeshStandardMaterial({ color: 0x4a4a5a });
		const stone = new THREE.Mesh(stoneGeo, stoneMat);
		stone.position.set(stoneX, 0.1, stoneZ);
		stone.castShadow = true;
		stone.receiveShadow = true;
		group.add(stone);
	}

	// 月明かり反射
	// メインCircleGeometry
	const mainReflectionGeo = new THREE.CircleGeometry(0.7, 16);
	const mainReflectionMat = new THREE.MeshBasicMaterial({
		color: 0xddeeff,
		transparent: true,
		opacity: 0.5,
	});
	const mainReflection = new THREE.Mesh(mainReflectionGeo, mainReflectionMat);
	mainReflection.rotation.x = -Math.PI / 2;
	mainReflection.position.set(0, 0.06, 0);
	group.add(mainReflection);

	// コアCircleGeometry
	const coreReflectionGeo = new THREE.CircleGeometry(0.25, 12);
	const coreReflectionMat = new THREE.MeshBasicMaterial({
		color: 0xffffff,
		transparent: true,
		opacity: 0.7,
	});
	const coreReflection = new THREE.Mesh(coreReflectionGeo, coreReflectionMat);
	coreReflection.rotation.x = -Math.PI / 2;
	coreReflection.position.set(0, 0.07, 0);
	group.add(coreReflection);

	// 揺らぎ5個
	for (let i = 0; i < 5; i++) {
		const shimmerRadius = 0.1 + seededRandom(seed + 200 + i) * 0.1; // 0.1-0.2
		const shimmerX = (seededRandom(seed + 300 + i) - 0.5) * 1.5;
		const shimmerZ = (seededRandom(seed + 400 + i) - 0.5) * 1.5;
		const shimmerOpacity = 0.3 + seededRandom(seed + 500 + i) * 0.2; // 0.3-0.5

		const shimmerGeo = new THREE.CircleGeometry(shimmerRadius, 8);
		const shimmerMat = new THREE.MeshBasicMaterial({
			color: 0xaaccff,
			transparent: true,
			opacity: shimmerOpacity,
		});
		const shimmer = new THREE.Mesh(shimmerGeo, shimmerMat);
		shimmer.rotation.x = -Math.PI / 2;
		shimmer.position.set(shimmerX, 0.06, shimmerZ);
		group.add(shimmer);
	}

	// 葦（4本のCylinderGeometry）
	for (let i = 0; i < 4; i++) {
		const reedAngle = (i / 4) * Math.PI * 2 + seededRandom(seed + 600 + i) * 0.5;
		const reedRadiusX = width * 0.9;
		const reedRadiusZ = depth * 0.9;
		const reedX = Math.cos(reedAngle) * reedRadiusX;
		const reedZ = Math.sin(reedAngle) * reedRadiusZ;
		const reedRadius = 0.02 + seededRandom(seed + 700 + i) * 0.01; // 0.02-0.03
		const reedHeight = 0.6 + seededRandom(seed + 800 + i) * 0.4; // 0.6-1.0

		const reedGeo = new THREE.CylinderGeometry(reedRadius, reedRadius, reedHeight, 8);
		const reedMat = new THREE.MeshStandardMaterial({ color: 0x2a4a2a });
		const reed = new THREE.Mesh(reedGeo, reedMat);
		reed.position.set(reedX, reedHeight / 2, reedZ);
		reed.castShadow = true;
		reed.receiveShadow = true;
		group.add(reed);
	}

	// ベンチ
	// 座面
	const seatGeo = new THREE.BoxGeometry(2, 0.1, 0.6);
	const woodMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a });
	const seat = new THREE.Mesh(seatGeo, woodMat);
	seat.position.set(width * 1.2, 0.5, 0);
	seat.castShadow = true;
	seat.receiveShadow = true;
	group.add(seat);

	// 脚4本
	const legGeo = new THREE.BoxGeometry(0.08, 0.5, 0.08);
	const legPositions = [
		[-0.9, 0, -0.25],
		[-0.9, 0, 0.25],
		[0.9, 0, -0.25],
		[0.9, 0, 0.25],
	];
	for (const pos of legPositions) {
		const leg = new THREE.Mesh(legGeo, woodMat);
		leg.position.set(width * 1.2 + pos[0], 0.25 + pos[1], pos[2]);
		leg.castShadow = true;
		leg.receiveShadow = true;
		group.add(leg);
	}

	// 背もたれ
	const backrestGeo = new THREE.BoxGeometry(1.8, 0.4, 0.08);
	const backrest = new THREE.Mesh(backrestGeo, woodMat);
	backrest.position.set(width * 1.2, 0.8, -0.3);
	backrest.castShadow = true;
	backrest.receiveShadow = true;
	group.add(backrest);

	// ランタン
	// ポール
	const poleGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8);
	const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
	const pole = new THREE.Mesh(poleGeo, poleMat);
	pole.position.set(width * 1.5, 0.6, 0);
	pole.castShadow = true;
	pole.receiveShadow = true;
	group.add(pole);

	// ランタン本体
	const lanternGeo = new THREE.BoxGeometry(0.2, 0.25, 0.2);
	const lanternMat = new THREE.MeshStandardMaterial({
		color: 0xffaa44,
		emissive: 0xffaa44,
		emissiveIntensity: 0.8,
	});
	const lantern = new THREE.Mesh(lanternGeo, lanternMat);
	lantern.position.set(width * 1.5, 1.3, 0);
	lantern.castShadow = true;
	group.add(lantern);

	// PointLight
	const lanternLight = new THREE.PointLight(0xffaa44, 0.4, 5);
	lanternLight.position.set(width * 1.5, 1.3, 0);
	lanternLight.castShadow = true;
	group.add(lanternLight);

	// グループ位置設定
	group.position.set(x, 0, z);

	return group;
}
