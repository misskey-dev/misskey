/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

// 仕様: ワープゲート3Dオブジェクト
// プレイヤーが触れると別ワールドに転移する

// 仕様: ワープゲートのスケール（通常のノクタウンスケールに合わせる）
// shrine-objects.tsのG=0.5と整合性を取るため、ゲートサイズを調整
const G = 1;

// 仕様: ワープゲートのスケール（適切なサイズに調整）
const WARP_GATE_SCALE = 0.5;

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
	// 仕様: FR-030 ワープゲート上部に表示するUnicode絵文字アイコン
	icon?: string;
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
	// 仕様: ワープ後の無限ループ防止
	// プレイヤーがゲート内にスポーンした場合、一度外に出るまで衝突を無効化
	private playerInsideGate: boolean = true; // 初期状態はtrue（スポーン時は内側と仮定）
	// 仕様: FR-030 ふわふわアイコン用
	private iconSprite: THREE.Sprite | null = null;
	private iconBaseY: number = 0;

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

		// 仕様: FR-030 アイコンを作成
		if (config.icon) {
			this.createFloatingIcon(config.icon);
		}
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

		// 仕様: FR-030 アイコンのふわふわアニメーション
		this.updateFloatingIcon(time);
	}

	/**
	 * プレイヤーとの衝突判定
	 * 仕様: 半径2.5以内に入ったらワープトリガー
	 * 仕様: 無限ループ防止 - 一度外に出てから再度入った時のみ発動
	 */
	public checkCollision(playerPosition: { x: number; z: number }): boolean {
		const dx = playerPosition.x - this.group.position.x;
		const dz = playerPosition.z - this.group.position.z;
		const distance = Math.sqrt(dx * dx + dz * dz);
		const isInside = distance < WARP_GATE_COLLISION_RADIUS;

		if (this.playerInsideGate) {
			// プレイヤーがゲート内にいる状態
			if (!isInside) {
				// 外に出た → フラグをリセット
				this.playerInsideGate = false;
			}
			// まだ外に出ていないので衝突判定しない
			return false;
		} else {
			// プレイヤーがゲート外にいる状態
			if (isInside) {
				// 外から入った → ワープ発動、フラグを立てる
				this.playerInsideGate = true;
				return true;
			}
			return false;
		}
	}

	/**
	 * ゲート内フラグをリセット
	 * 仕様: ワールド切り替え時に呼び出して、新しいゲートでの判定を正しく開始
	 */
	public resetInsideFlag(): void {
		this.playerInsideGate = true; // 新しいワールドではゲート内にいると仮定
	}

	/**
	 * 仕様: FR-030 ワープゲート上部に浮遊するUnicode絵文字アイコンを作成
	 * Canvasに絵文字を描画してテクスチャ化し、Spriteとして表示
	 */
	private createFloatingIcon(emoji: string): void {
		// Canvasで絵文字をテクスチャ化
		const canvas = document.createElement('canvas');
		const size = 128;
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// 背景を透明に
		ctx.clearRect(0, 0, size, size);

		// 絵文字を描画
		ctx.font = `${size * 0.7}px sans-serif`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(emoji, size / 2, size / 2);

		// テクスチャを作成
		const texture = new THREE.CanvasTexture(canvas);
		texture.needsUpdate = true;

		// スプライトマテリアル
		const material = new THREE.SpriteMaterial({
			map: texture,
			transparent: true,
			depthWrite: false,
		});

		// スプライトを作成
		this.iconSprite = new THREE.Sprite(material);

		// 仕様: アイコンサイズと位置（WARP_GATE_SCALEを考慮して調整）
		// groupにscaleが掛かっているので、逆数を掛けて実際のサイズを調整
		// 仕様変更: サイズを1/4に縮小（ユーザー要望）
		const iconSize = 1 / WARP_GATE_SCALE; // 実際に表示されるサイズが1程度になるよう調整（元の1/4）
		this.iconSprite.scale.set(iconSize, iconSize, 1);

		// 仕様: ワープゲートのすぐ上に配置（y=4）
		// 仕様変更: 位置をさらに低く調整（ユーザー要望）
		this.iconBaseY = 4 / WARP_GATE_SCALE;
		this.iconSprite.position.set(0, this.iconBaseY, 0);

		this.group.add(this.iconSprite);
	}

	/**
	 * 仕様: FR-030 アイコンのふわふわアニメーション更新
	 */
	private updateFloatingIcon(time: number): void {
		if (!this.iconSprite) return;

		// 仕様: ふわふわ上下運動（sin波で滑らか）
		// 振幅0.2、周期は約3秒（アイコンが小さくなったので振幅も調整）
		const floatOffset = Math.sin(time * 2.0) * 0.2 / WARP_GATE_SCALE;
		this.iconSprite.position.y = this.iconBaseY + floatOffset;

		// 仕様: 軽い回転（カメラに対して常に正面を向くのでZ軸回転のみ）
		// ゆっくり揺れる感じ
		this.iconSprite.material.rotation = Math.sin(time * 1.5) * 0.1;
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
			// 仕様: FR-030 アイコンスプライトのクリーンアップ
			if (obj instanceof THREE.Sprite) {
				obj.geometry.dispose();
				if (obj.material instanceof THREE.SpriteMaterial) {
					obj.material.map?.dispose();
					obj.material.dispose();
				}
			}
		});
	}
}

/**
 * デフォルトワールド→神社ワールドへのワープゲートを作成
 * 仕様: 位置は(0,0)ではなく少しずらした場所に配置（warp_gate.html準拠: 白色）
 * 仕様: FR-030 アイコンは⛩️（神社ワールドへ行くゲート）
 */
export function createDefaultToShrineGate(): WarpGate {
	return new WarpGate({
		id: 'warp-gate-to-shrine',
		position: { x: 10, y: 0, z: -15 }, // スポーン地点から少し離れた場所
		targetWorldId: 'shrine-world-001',
		color: 0xffffff, // 白色（warp_gate.html準拠）
		icon: '⛩️', // 仕様: FR-030 神社ワールド行きを示すアイコン
	});
}

/**
 * 神社ワールド→デフォルトワールドへのワープゲートを作成
 * 仕様: warp_gate.html準拠で白色
 * 仕様: FR-030 アイコンは🌲（デフォルトワールドへ行くゲート）
 * 仕様: FR-018a 位置は(0,0,57)に配置
 */
export function createShrineToDefaultGate(): WarpGate {
	return new WarpGate({
		id: 'warp-gate-to-default',
		position: { x: 0, y: 0, z: 57 }, // 仕様: FR-018a 神社ワールドの(0,0,57)に配置
		targetWorldId: null, // null = デフォルトワールド
		color: 0xffffff, // 白色（warp_gate.html準拠）
		icon: '🌲', // 仕様: FR-030 デフォルトワールド行きを示すアイコン
	});
}
