/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

// 仕様: ワープゲート3Dオブジェクト
// プレイヤーが触れると別ワールドに転移する

const G = 32;

// 仕様: ワープゲートのスケール（1/4サイズ）
const WARP_GATE_SCALE = 0.25;

// ワープゲートの衝突判定半径（スケールに合わせて調整）
export const WARP_GATE_COLLISION_RADIUS = 2.5 * WARP_GATE_SCALE;

// シェーダー定義
const vortexVertexShader = `
	varying vec2 vUv;
	void main() {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const vortexFragmentShader = `
	uniform float time;
	uniform vec3 color1;
	uniform vec3 color2;
	varying vec2 vUv;

	void main() {
		vec2 center = vUv - 0.5;
		float dist = length(center);
		float angle = atan(center.y, center.x);

		// 渦巻きパターン
		float spiral = sin(angle * 4.0 - dist * 10.0 + time * 1.0) * 0.5 + 0.5;

		// 中心からのグラデーション
		float fade = 1.0 - smoothstep(0.0, 0.5, dist);

		// パルス効果
		float pulse = sin(time * 0.8) * 0.1 + 0.9;

		vec3 color = mix(color2, color1, spiral * fade * pulse);
		float alpha = fade * 0.7 * pulse;

		gl_FragColor = vec4(color, alpha);
	}
`;

// 仕様: 光の柱シェーダー（warp_gate.html準拠）
const pillarVertexShader = `
	varying vec2 vUv;
	varying float vY;
	void main() {
		vUv = uv;
		vY = position.y;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const pillarFragmentShader = `
	uniform float time;
	uniform vec3 color;
	varying vec2 vUv;
	varying float vY;

	void main() {
		float stripe = sin(vUv.x * 20.0 + time * 1.5) * 0.5 + 0.5;
		float verticalWave = sin(vY * 0.3 - time * 1.0) * 0.2 + 0.8;
		float fade = 1.0 - smoothstep(0.0, 6.0, vY + 6.0);
		float alpha = stripe * verticalWave * fade * 0.5;
		gl_FragColor = vec4(color, alpha);
	}
`;

const innerPillarFragmentShader = `
	uniform float time;
	uniform vec3 color;
	varying vec2 vUv;
	varying float vY;

	void main() {
		float wave = sin(vY * 0.4 - time * 1.2) * 0.3 + 0.7;
		float fade = 1.0 - smoothstep(0.0, 5.0, vY + 5.0);
		float alpha = wave * fade * 0.4;
		gl_FragColor = vec4(color, alpha);
	}
`;

export interface WarpGateConfig {
	id: string;
	position: { x: number; y: number; z: number };
	targetWorldId: string | null;
	color?: number;
}

/**
 * ワープゲートオブジェクト
 * 仕様: 渦巻きエフェクト付きのポータル（warp_gate.html準拠）
 * - 外側と内側の光る輪
 * - 渦巻きポータル
 * - 上昇する光の柱（外側と内側）
 * - 浮遊パーティクル
 */
export class WarpGate {
	public group: THREE.Group;
	public config: WarpGateConfig;
	private portalMaterial!: THREE.ShaderMaterial;
	private pillarMaterial!: THREE.ShaderMaterial;
	private innerPillarMaterial!: THREE.ShaderMaterial;
	private outerRing!: THREE.Mesh;
	private innerRing!: THREE.Mesh;
	private particles!: THREE.Points;
	private light!: THREE.PointLight;

	constructor(config: WarpGateConfig) {
		this.config = config;
		this.group = new THREE.Group();
		this.group.position.set(config.position.x, config.position.y, config.position.z);
		// 仕様: ワープゲートを1/4サイズに縮小
		this.group.scale.set(WARP_GATE_SCALE, WARP_GATE_SCALE, WARP_GATE_SCALE);
		this.group.userData.type = 'warpGate';
		this.group.userData.gateId = config.id;
		this.group.userData.targetWorldId = config.targetWorldId;

		// 仕様: warp_gate.html準拠で白色をデフォルトに
		const color = config.color ?? 0xffffff;
		this.createGate(color);
	}

	private createGate(color: number): void {
		// 外側の光る輪
		const outerRingGeo = new THREE.TorusGeometry(3, 0.15, 16, 64);
		const outerRingMat = new THREE.MeshBasicMaterial({
			color,
			transparent: true,
			opacity: 0.9,
		});
		this.outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
		this.outerRing.rotation.x = -Math.PI / 2;
		this.outerRing.position.y = 0.1;
		this.group.add(this.outerRing);

		// 内側の輪
		const innerRingGeo = new THREE.TorusGeometry(2.2, 0.08, 16, 64);
		const innerRingMat = new THREE.MeshBasicMaterial({
			color,
			transparent: true,
			opacity: 0.7,
		});
		this.innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
		this.innerRing.rotation.x = -Math.PI / 2;
		this.innerRing.position.y = 0.15;
		this.group.add(this.innerRing);

		// 渦巻きポータル
		const portalGeo = new THREE.CircleGeometry(2.8, 64);
		this.portalMaterial = new THREE.ShaderMaterial({
			uniforms: {
				time: { value: 0 },
				color1: { value: new THREE.Color(color) },
				color2: { value: new THREE.Color(0x000000) },
			},
			vertexShader: vortexVertexShader,
			fragmentShader: vortexFragmentShader,
			transparent: true,
			side: THREE.DoubleSide,
			depthWrite: false,
		});
		const portal = new THREE.Mesh(portalGeo, this.portalMaterial);
		portal.rotation.x = -Math.PI / 2;
		portal.position.y = 0.05;
		this.group.add(portal);

		// 仕様: 上昇する光の柱（外側）- warp_gate.html準拠
		const pillarGeo = new THREE.CylinderGeometry(2.2, 2.8, 12, 32, 1, true);
		this.pillarMaterial = new THREE.ShaderMaterial({
			uniforms: {
				time: { value: 0 },
				color: { value: new THREE.Color(color) },
			},
			vertexShader: pillarVertexShader,
			fragmentShader: pillarFragmentShader,
			transparent: true,
			side: THREE.DoubleSide,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
		});
		const pillar = new THREE.Mesh(pillarGeo, this.pillarMaterial);
		pillar.position.y = 6;
		this.group.add(pillar);

		// 仕様: 内側の光の柱（より明るい）- warp_gate.html準拠
		const innerPillarGeo = new THREE.CylinderGeometry(1.2, 1.6, 10, 32, 1, true);
		this.innerPillarMaterial = new THREE.ShaderMaterial({
			uniforms: {
				time: { value: 0 },
				color: { value: new THREE.Color(color) },
			},
			vertexShader: pillarVertexShader,
			fragmentShader: innerPillarFragmentShader,
			transparent: true,
			side: THREE.DoubleSide,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
		});
		const innerPillar = new THREE.Mesh(innerPillarGeo, this.innerPillarMaterial);
		innerPillar.position.y = 5;
		this.group.add(innerPillar);

		// 浮遊パーティクル（仕様準拠で増量: 50 → 120）
		this.createParticles(color);

		// ポイントライト（仕様準拠で強化: 2 → 5、範囲 10 → 20）
		this.light = new THREE.PointLight(color, 5, 20);
		this.light.position.y = 2;
		this.group.add(this.light);

		// スポットライト（上方向に照射）
		const spotLight = new THREE.SpotLight(color, 3, 30, Math.PI / 6, 0.5);
		spotLight.position.y = 0.5;
		spotLight.target.position.y = 30;
		this.group.add(spotLight);
		this.group.add(spotLight.target);
	}

	private createParticles(color: number): void {
		// 仕様: warp_gate.html準拠でパーティクル数を増量（50 → 120）
		const particleCount = 120;
		const positions = new Float32Array(particleCount * 3);
		const velocities: number[] = [];

		for (let i = 0; i < particleCount; i++) {
			const angle = Math.random() * Math.PI * 2;
			const radius = Math.random() * 2.5;
			positions[i * 3] = Math.cos(angle) * radius;
			positions[i * 3 + 1] = Math.random() * 3;
			positions[i * 3 + 2] = Math.sin(angle) * radius;
			velocities.push(Math.random() * 0.02 + 0.01);
		}

		const particleGeo = new THREE.BufferGeometry();
		particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

		const particleMat = new THREE.PointsMaterial({
			color,
			size: 0.1,
			transparent: true,
			opacity: 0.8,
			blending: THREE.AdditiveBlending,
		});

		this.particles = new THREE.Points(particleGeo, particleMat);
		this.particles.userData.velocities = velocities;
		this.group.add(this.particles);
	}

	/**
	 * アニメーション更新
	 * 仕様: フレームごとに呼び出してエフェクトを更新（warp_gate.html準拠）
	 */
	public update(deltaTime: number): void {
		const time = this.portalMaterial.uniforms.time.value + deltaTime;

		// 渦巻きアニメーション
		this.portalMaterial.uniforms.time.value = time;

		// 光の柱アニメーション
		this.pillarMaterial.uniforms.time.value = time;
		this.innerPillarMaterial.uniforms.time.value = time;

		// 輪の回転（ゆっくりに調整: warp_gate.html準拠）
		this.outerRing.rotation.z += deltaTime * 0.2;
		this.innerRing.rotation.z -= deltaTime * 0.3;

		// ライトの明滅（穏やかに: warp_gate.html準拠）
		this.light.intensity = 4 + Math.sin(time * 1.5) * 0.5;

		// パーティクルの上昇（速度調整）
		const positions = this.particles.geometry.attributes.position as THREE.BufferAttribute;
		const velocities = this.particles.userData.velocities as number[];

		for (let i = 0; i < positions.count; i++) {
			let y = positions.getY(i);
			y += velocities[i];
			if (y > 6) { // 柱の高さに合わせて調整
				y = 0;
				const angle = Math.random() * Math.PI * 2;
				const radius = 0.5 + Math.random() * 2.3; // 半径調整
				positions.setX(i, Math.cos(angle) * radius);
				positions.setZ(i, Math.sin(angle) * radius);
			}
			positions.setY(i, y);
		}
		positions.needsUpdate = true;
	}

	/**
	 * プレイヤーとの衝突判定
	 * 仕様: 半径2.5以内に入ったらワープトリガー
	 */
	public checkCollision(playerPosition: { x: number; z: number }): boolean {
		const dx = playerPosition.x - this.group.position.x;
		const dz = playerPosition.z - this.group.position.z;
		const distance = Math.sqrt(dx * dx + dz * dz);
		return distance < WARP_GATE_COLLISION_RADIUS;
	}

	/**
	 * クリーンアップ
	 */
	public dispose(): void {
		this.group.traverse((obj) => {
			if (obj instanceof THREE.Mesh) {
				obj.geometry.dispose();
				if (obj.material instanceof THREE.Material) {
					obj.material.dispose();
				}
			}
		});
	}
}

/**
 * デフォルトワールド→神社ワールドへのワープゲートを作成
 * 仕様: 位置は(0,0)ではなく少しずらした場所に配置（warp_gate.html準拠: 白色）
 */
export function createDefaultToShrineGate(): WarpGate {
	return new WarpGate({
		id: 'warp-gate-to-shrine',
		position: { x: 10, y: 0, z: -15 }, // スポーン地点から少し離れた場所
		targetWorldId: 'shrine-world-001',
		color: 0xffffff, // 白色（warp_gate.html準拠）
	});
}

/**
 * 神社ワールド→デフォルトワールドへのワープゲートを作成
 * 仕様: warp_gate.html準拠で白色
 */
export function createShrineToDefaultGate(): WarpGate {
	return new WarpGate({
		id: 'warp-gate-to-default',
		position: { x: 0, y: 0, z: G * 55 }, // 神社入口付近
		targetWorldId: null, // null = デフォルトワールド
		color: 0xffffff, // 白色（warp_gate.html準拠）
	});
}
