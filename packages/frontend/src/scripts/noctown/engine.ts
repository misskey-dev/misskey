/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Character } from './character.js';
import { addRandomEnvironmentEntities } from './environment.js';
import { createPondMesh } from './pond.js';
import { createLakeMesh } from './lake.js';
import { createFarmPlotMesh } from './farm-plot.js';
import { ChunkEnvironmentRenderer, type EnvironmentObjectData } from './environment-objects.js';
import { PetManager, type PetInfo } from './pet.js';

// FR-022: PetInfo型をre-export
export type { PetInfo } from './pet.js';

// FR-008: 時間帯別ライティング設定
type TimePeriod = 'morning' | 'day' | 'evening' | 'night';

interface LightingConfig {
	ambient: { color: number; intensity: number };
	directional: { color: number; intensity: number; position: [number, number, number] };
	background: number;
	fog: number;
}

const LIGHTING_CONFIG: Record<TimePeriod, LightingConfig> = {
	morning: {
		ambient: { color: 0xffd4a6, intensity: 0.9 }, // 0.6 → 0.9 に明るく
		directional: { color: 0xffaa77, intensity: 1.0, position: [-20, 15, 0] }, // 0.7 → 1.0 に明るく
		background: 0x87ceeb, // 朝の空
		fog: 0x87ceeb,
	},
	day: {
		ambient: { color: 0xffffff, intensity: 1.1 }, // 0.8 → 1.1 に明るく
		directional: { color: 0xffffee, intensity: 1.3, position: [0, 25, 0] }, // 1.0 → 1.3 に明るく
		background: 0x87ceeb, // 昼の空
		fog: 0x87ceeb,
	},
	evening: {
		ambient: { color: 0xff8844, intensity: 0.5 },
		directional: { color: 0xff6644, intensity: 0.6, position: [20, 15, 0] },
		background: 0xff6b35, // 夕焼け
		fog: 0xff6b35,
	},
	night: {
		ambient: { color: 0x334466, intensity: 0.7 },
		directional: { color: 0x8899dd, intensity: 0.9, position: [10, 20, 10] },
		background: 0x0f1225, // 夜空
		fog: 0x0f1225,
	},
};

// 時間帯判定関数（日本時間 JST=UTC+9 を基準とする）
function getCurrentTimePeriod(): TimePeriod {
	const now = new Date();
	// 日本時間（JST）の時刻を取得：UTC + 9時間
	const jstHour = (now.getUTCHours() + 9) % 24;

	console.log('[Noctown Lighting] Current JST hour:', jstHour); // デバッグログ

	if (jstHour >= 6 && jstHour < 9) return 'morning';
	if (jstHour >= 9 && jstHour < 17) return 'day';
	if (jstHour >= 17 && jstHour < 19) return 'evening';
	return 'night';
}

// グラデーション遷移用ヘルパー関数
function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

function lerpColor(colorA: number, colorB: number, t: number): number {
	const rA = (colorA >> 16) & 0xff;
	const gA = (colorA >> 8) & 0xff;
	const bA = colorA & 0xff;
	const rB = (colorB >> 16) & 0xff;
	const gB = (colorB >> 8) & 0xff;
	const bB = colorB & 0xff;
	const r = Math.round(lerp(rA, rB, t));
	const g = Math.round(lerp(gA, gB, t));
	const b = Math.round(lerp(bA, bB, t));
	return (r << 16) | (g << 8) | b;
}

// 時間帯境界でのグラデーション遷移を計算（日本時間基準）
function getTransitionProgress(): { from: TimePeriod; to: TimePeriod; progress: number } | null {
	const now = new Date();
	// 日本時間（JST）の時刻を取得：UTC + 9時間
	const jstHour = (now.getUTCHours() + 9) % 24;
	const minute = now.getUTCMinutes();
	const totalMinutes = jstHour * 60 + minute;

	// 各境界時刻（分）: 朝6:00, 昼9:00, 夕17:00, 夜19:00
	const transitions: { time: number; from: TimePeriod; to: TimePeriod }[] = [
		{ time: 6 * 60, from: 'night', to: 'morning' },
		{ time: 9 * 60, from: 'morning', to: 'day' },
		{ time: 17 * 60, from: 'day', to: 'evening' },
		{ time: 19 * 60, from: 'evening', to: 'night' },
	];

	const TRANSITION_DURATION = 5; // 5分間でグラデーション遷移

	for (const transition of transitions) {
		const start = transition.time - Math.floor(TRANSITION_DURATION / 2);
		const end = transition.time + Math.ceil(TRANSITION_DURATION / 2);

		if (totalMinutes >= start && totalMinutes < end) {
			const progress = (totalMinutes - start) / TRANSITION_DURATION;
			return { from: transition.from, to: transition.to, progress: Math.max(0, Math.min(1, progress)) };
		}
	}

	return null;
}

export interface PlayerData {
	id: string;
	userId: string;
	username: string;
	name: string | null;
	avatarUrl: string | null;
	positionX: number;
	positionY: number;
	positionZ: number;
	rotation: number;
	isOnline: boolean;
}

export interface ChunkData {
	chunkX: number;
	chunkZ: number;
	worldId?: string;
	terrainData: number[] | {
		heightMap: number[][];
		version: number;
	};
	biome: string;
	environmentObjects?: EnvironmentObjectData[];
}

export interface DroppedItemData {
	id: string;
	itemId: string;
	itemName: string;
	itemType: string;
	positionX: number;
	positionY: number;
	positionZ: number;
}

export interface PlacedItemData {
	id: string;
	itemId: string;
	itemName: string;
	itemType: string;
	ownerUsername: string;
	positionX: number;
	positionY: number;
	positionZ: number;
	rotation: number;
}

export interface NpcData {
	id: string;
	playerId: string;
	username: string;
	avatarUrl: string | null;
	positionX: number;
	positionY: number;
	positionZ: number;
}

export class NoctownEngine {
	private scene: THREE.Scene;
	private camera: THREE.OrthographicCamera;
	private renderer: THREE.WebGLRenderer;
	private labelRenderer: CSS2DRenderer;
	private container: HTMLElement;
	private animationId: number | null = null;

	// Player management
	private localPlayer: Character | null = null;
	private localPlayerId: string | null = null; // 自プレイヤーのID
	private remotePlayers: Map<string, Character> = new Map();
	private lastMoveDirection: { x: number; z: number } = { x: 0, z: 0 };
	private lastFrameTime: number = 0;
	private currentInput: { up: boolean; down: boolean; left: boolean; right: boolean; sprint: boolean } = {
		up: false,
		down: false,
		left: false,
		right: false,
		sprint: false,
	};
	// ジョイスティック入力がアクティブかどうか（setInput()で設定され、clearInput()でリセット）
	private isJoystickActive: boolean = false;
	// Track remote player positions for movement direction calculation
	// 仕様: animateループで前回の実際の描画位置を保存し、次フレームで移動方向を計算する
	// 修正日: 2025-12-14
	// 修正内容: updateRemotePlayerで目標位置を保存していたため、lerp中に逆方向を計算してしまう問題を修正
	private remotePlayerLastPos: Map<string, { x: number; z: number; time: number }> = new Map();

	// World management
	private chunks: Map<string, THREE.Group> = new Map();

	// Item management
	private droppedItems: Map<string, THREE.Mesh> = new Map();
	private placedItems: Map<string, THREE.Group> = new Map();

	// NPC management
	private npcs: Map<string, THREE.Group> = new Map();
	private npcLabels: Map<string, THREE.Sprite> = new Map();

	// FR-018: Raycaster for player click detection
	private raycaster: THREE.Raycaster = new THREE.Raycaster();
	private mouse: THREE.Vector2 = new THREE.Vector2();
	private remotePlayerData: Map<string, PlayerData> = new Map();

	// Camera follow
	private cameraOffset = new THREE.Vector3(0, 10, 15);
	private cameraLookAtTarget = new THREE.Vector3(0, 0, 0);

	// Input state
	private keys: Set<string> = new Set();
	private isDisposed = false;

	// FR-008: 時間帯別ライティング
	private ambientLight: THREE.AmbientLight | null = null;
	private directionalLight: THREE.DirectionalLight | null = null;
	private currentTimePeriod: TimePeriod = 'night';
	private lastTimeCheck: number = 0;

	// FR-022: ペット管理
	private petManager: PetManager | null = null;

	constructor(container: HTMLElement) {
		this.container = container;

		// Scene - FR-008: 背景色と霧はsetupLights()で時間帯に応じて設定
		this.scene = new THREE.Scene();

		// Camera - Quarter View (Orthographic)
		const aspect = container.clientWidth / container.clientHeight;
		const viewSize = 10;
		this.camera = new THREE.OrthographicCamera(
			-viewSize * aspect,
			viewSize * aspect,
			viewSize,
			-viewSize,
			0.1,
			1000,
		);
		// Animal Crossing style - front top-down view
		this.camera.position.set(0, 15, 20);
		this.camera.lookAt(0, 0, 0);

		// Renderer
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(container.clientWidth, container.clientHeight);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		container.appendChild(this.renderer.domElement);

		// CSS2D Renderer for labels
		this.labelRenderer = new CSS2DRenderer();
		this.labelRenderer.setSize(container.clientWidth, container.clientHeight);
		this.labelRenderer.domElement.style.position = 'absolute';
		this.labelRenderer.domElement.style.top = '0';
		this.labelRenderer.domElement.style.pointerEvents = 'none';
		container.appendChild(this.labelRenderer.domElement);

		// Lights
		this.setupLights();

		// Ground plane (temporary)
		this.createGroundPlane();

		// FR-022: ペット管理の初期化
		this.petManager = new PetManager(this.scene);

		// Event listeners
		this.setupEventListeners();

		// Start render loop
		this.animate();
	}

	private setupLights(): void {
		// FR-008: 時間帯別ライティング設定
		this.currentTimePeriod = getCurrentTimePeriod();
		const config = LIGHTING_CONFIG[this.currentTimePeriod];

		// 背景色と霧を時間帯に合わせて設定
		this.scene.background = new THREE.Color(config.background);
		this.scene.fog = new THREE.Fog(config.fog, 50, 120);

		// アンビエントライト
		this.ambientLight = new THREE.AmbientLight(config.ambient.color, config.ambient.intensity);
		this.scene.add(this.ambientLight);

		// ディレクショナルライト（太陽/月）
		this.directionalLight = new THREE.DirectionalLight(config.directional.color, config.directional.intensity);
		this.directionalLight.position.set(...config.directional.position);
		this.directionalLight.castShadow = true;
		this.directionalLight.shadow.mapSize.width = 2048;
		this.directionalLight.shadow.mapSize.height = 2048;
		this.directionalLight.shadow.camera.near = 0.5;
		this.directionalLight.shadow.camera.far = 50;
		this.directionalLight.shadow.camera.left = -20;
		this.directionalLight.shadow.camera.right = 20;
		this.directionalLight.shadow.camera.top = 20;
		this.directionalLight.shadow.camera.bottom = -20;
		this.scene.add(this.directionalLight);
		this.scene.add(this.directionalLight.target);

		// 月を追加（夜のみ表示）
		const moonGeo = new THREE.SphereGeometry(3, 32, 32);
		const moonMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
		const moon = new THREE.Mesh(moonGeo, moonMat);
		moon.position.set(50, 60, -80);
		moon.name = 'moon';
		moon.visible = this.currentTimePeriod === 'night';
		this.scene.add(moon);

		// 月のグロー効果
		const moonGlowGeo = new THREE.SphereGeometry(4, 32, 32);
		const moonGlowMat = new THREE.MeshBasicMaterial({
			color: 0x4466aa,
			transparent: true,
			opacity: 0.3
		});
		const moonGlow = new THREE.Mesh(moonGlowGeo, moonGlowMat);
		moonGlow.position.set(50, 60, -80);
		moonGlow.name = 'moonGlow';
		moonGlow.visible = this.currentTimePeriod === 'night';
		this.scene.add(moonGlow);

		// 星空を追加（夜のみ表示）
		const starsGeometry = new THREE.BufferGeometry();
		const starPositions: number[] = [];
		for (let i = 0; i < 1000; i++) {
			const x = (Math.random() - 0.5) * 500;
			const y = Math.random() * 100 + 30;
			const z = (Math.random() - 0.5) * 500;
			starPositions.push(x, y, z);
		}
		starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
		const starsMaterial = new THREE.PointsMaterial({
			color: 0xffffff,
			size: 0.3,
			transparent: true,
			opacity: 0.8
		});
		const stars = new THREE.Points(starsGeometry, starsMaterial);
		stars.name = 'stars';
		stars.visible = this.currentTimePeriod === 'night';
		this.scene.add(stars);
	}

	// FR-008: 時間帯別ライティング更新
	private updateLighting(): void {
		// DirectionalLightのプレイヤー追従は毎フレーム実行
		if (this.directionalLight && this.localPlayer) {
			const config = LIGHTING_CONFIG[this.currentTimePeriod];
			const basePos = config.directional.position;
			const playerPos = this.localPlayer.getPosition();
			this.directionalLight.position.set(
				playerPos.x + basePos[0],
				basePos[1],
				playerPos.z + basePos[2]
			);
			this.directionalLight.target.position.set(playerPos.x, 0, playerPos.z);
		}

		const now = Date.now();
		// 1秒ごとに時間帯をチェック（パフォーマンス最適化）
		if (now - this.lastTimeCheck < 1000) return;
		this.lastTimeCheck = now;

		const transition = getTransitionProgress();
		let targetConfig: LightingConfig;
		let needsUpdate = false;

		if (transition) {
			// グラデーション遷移中
			const fromConfig = LIGHTING_CONFIG[transition.from];
			const toConfig = LIGHTING_CONFIG[transition.to];
			const t = transition.progress;

			targetConfig = {
				ambient: {
					color: lerpColor(fromConfig.ambient.color, toConfig.ambient.color, t),
					intensity: lerp(fromConfig.ambient.intensity, toConfig.ambient.intensity, t),
				},
				directional: {
					color: lerpColor(fromConfig.directional.color, toConfig.directional.color, t),
					intensity: lerp(fromConfig.directional.intensity, toConfig.directional.intensity, t),
					position: [
						lerp(fromConfig.directional.position[0], toConfig.directional.position[0], t),
						lerp(fromConfig.directional.position[1], toConfig.directional.position[1], t),
						lerp(fromConfig.directional.position[2], toConfig.directional.position[2], t),
					] as [number, number, number],
				},
				background: lerpColor(fromConfig.background, toConfig.background, t),
				fog: lerpColor(fromConfig.fog, toConfig.fog, t),
			};
			needsUpdate = true;

			// 時間帯が変わったかチェック
			const newPeriod = t >= 0.5 ? transition.to : transition.from;
			if (newPeriod !== this.currentTimePeriod) {
				this.currentTimePeriod = newPeriod;
				this.updateNightObjects();
			}
		} else {
			const newPeriod = getCurrentTimePeriod();
			if (newPeriod !== this.currentTimePeriod) {
				this.currentTimePeriod = newPeriod;
				targetConfig = LIGHTING_CONFIG[newPeriod];
				this.updateNightObjects();
				needsUpdate = true;
			} else {
				return; // 時間帯の変更なし、プレイヤー追従は上で処理済み
			}
		}

		if (!needsUpdate) return;

		// ライティングを更新
		if (this.ambientLight) {
			this.ambientLight.color.setHex(targetConfig.ambient.color);
			this.ambientLight.intensity = targetConfig.ambient.intensity;
		}

		if (this.directionalLight) {
			this.directionalLight.color.setHex(targetConfig.directional.color);
			this.directionalLight.intensity = targetConfig.directional.intensity;
		}

		// 背景色と霧を更新
		(this.scene.background as THREE.Color).setHex(targetConfig.background);
		if (this.scene.fog instanceof THREE.Fog) {
			this.scene.fog.color.setHex(targetConfig.fog);
		}
	}

	// 夜専用オブジェクト（月、星）の表示/非表示を切り替え
	private updateNightObjects(): void {
		const isNight = this.currentTimePeriod === 'night';
		const moon = this.scene.getObjectByName('moon');
		const moonGlow = this.scene.getObjectByName('moonGlow');
		const stars = this.scene.getObjectByName('stars');

		if (moon) moon.visible = isNight;
		if (moonGlow) moonGlow.visible = isNight;
		if (stars) stars.visible = isNight;
	}

	private createGroundPlane(): void {
		const geometry = new THREE.PlaneGeometry(500, 500);
		const material = new THREE.MeshStandardMaterial({
			color: 0x2a3a2a, // 夜の草地（少し明るめ）
			roughness: 0.9,
		});
		const ground = new THREE.Mesh(geometry, material);
		ground.rotation.x = -Math.PI / 2;
		ground.position.y = 0;
		ground.receiveShadow = true;
		this.scene.add(ground);
	}

	/**
	 * Render chunk with grid lines (FR-073, FR-074)
	 * @param chunkData Chunk data from server
	 */
	// FR-001: terrainDataに基づいてチャンクを生成
	public async renderChunk(chunkData: ChunkData): Promise<void> {
		const key = `${chunkData.chunkX}_${chunkData.chunkZ}`;
		if (this.chunks.has(key)) return; // Already rendered

		const CHUNK_SIZE = 16;
		const offsetX = chunkData.chunkX * CHUNK_SIZE;
		const offsetZ = chunkData.chunkZ * CHUNK_SIZE;

		const chunkGroup = new THREE.Group();
		chunkGroup.position.set(offsetX, 0, offsetZ);

		// FR-001: Add grid helper (character-demo+14-fishing準拠)
		const gridHelper = new THREE.GridHelper(CHUNK_SIZE, CHUNK_SIZE, 0x2a3a3a, 0x2a3a3a);
		gridHelper.position.set(0, 0.01, 0); // y=0.01 to avoid z-fighting
		chunkGroup.add(gridHelper);

		// FR-001: terrainDataに基づいて地形を生成
		// 池・湖は連続領域の中心に1つだけ配置する（重複生成を防ぐ）
		if (chunkData.terrainData && Array.isArray(chunkData.terrainData)) {
			const { createPondMesh } = await import('./pond.js');
			const { createLakeMesh } = await import('./lake.js');
			const { createFarmPlotMesh } = await import('./farm-plot.js');

			// 池・湖の領域を検出して中心座標を計算
			const processedTiles = new Set<string>();
			const findTerrainCenter = (startX: number, startZ: number, targetType: number): { centerX: number; centerZ: number } | null => {
				const tiles: Array<{ x: number; z: number }> = [];
				const stack: Array<{ x: number; z: number }> = [{ x: startX, z: startZ }];

				while (stack.length > 0) {
					const { x, z } = stack.pop()!;
					const key = `${x},${z}`;
					if (processedTiles.has(key)) continue;
					if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) continue;
					if (chunkData.terrainData[x * CHUNK_SIZE + z] !== targetType) continue;

					processedTiles.add(key);
					tiles.push({ x, z });

					// 4方向を探索
					stack.push({ x: x + 1, z });
					stack.push({ x: x - 1, z });
					stack.push({ x, z: z + 1 });
					stack.push({ x, z: z - 1 });
				}

				if (tiles.length === 0) return null;

				// 中心座標を計算
				const sumX = tiles.reduce((sum, t) => sum + t.x, 0);
				const sumZ = tiles.reduce((sum, t) => sum + t.z, 0);
				return {
					centerX: sumX / tiles.length,
					centerZ: sumZ / tiles.length,
				};
			};

			// terrainDataを走査して地形タイプに応じたメッシュを追加
			for (let x = 0; x < CHUNK_SIZE; x++) {
				for (let z = 0; z < CHUNK_SIZE; z++) {
					const terrainType = chunkData.terrainData[x * CHUNK_SIZE + z];
					const tileKey = `${x},${z}`;

					if (terrainType === 1 && !processedTiles.has(tileKey)) {
						// FR-001: 池領域の中心に1つだけ生成
						const center = findTerrainCenter(x, z, 1);
						if (center) {
							const worldX = offsetX + center.centerX;
							const worldZ = offsetZ + center.centerZ;
							const seed = Math.floor(worldX) * 1000 + Math.floor(worldZ);
							const pond = createPondMesh(worldX, worldZ, seed);
							chunkGroup.add(pond);
						}
					} else if (terrainType === 2 && !processedTiles.has(tileKey)) {
						// FR-001: 湖領域の中心に1つだけ生成
						const center = findTerrainCenter(x, z, 2);
						if (center) {
							const worldX = offsetX + center.centerX;
							const worldZ = offsetZ + center.centerZ;
							const seed = Math.floor(worldX) * 1000 + Math.floor(worldZ);
							const lake = createLakeMesh(worldX, worldZ, seed);
							chunkGroup.add(lake);
						}
					} else if (terrainType === 3) {
						// FR-001: 農園プロットはタイルごとに生成
						const worldX = offsetX + x;
						const worldZ = offsetZ + z;
						const farmPlot = createFarmPlotMesh(worldX, worldZ);
						chunkGroup.add(farmPlot.group);
					}
				}
			}
		}

		this.scene.add(chunkGroup);
		this.chunks.set(key, chunkGroup);

		// FR-010: Add environment entities from backend data（chunkGroupに追加してリロード時に削除されるようにする）
		if (chunkData.environmentObjects && Array.isArray(chunkData.environmentObjects)) {
			const { addTree, addRock } = await import('./environment.js');
			for (const obj of chunkData.environmentObjects) {
				const worldX = offsetX + obj.localX;
				const worldZ = offsetZ + obj.localZ;

				if (obj.type === 'tree') {
					addTree(chunkGroup, worldX, worldZ);
				} else if (obj.type === 'rock') {
					const scale = obj.scale ?? 1.0;
					addRock(chunkGroup, worldX, worldZ, scale);
				}
			}
		} else {
			// Fallback: Use client-side generation if no backend data（chunkGroupに追加）
			addRandomEnvironmentEntities(chunkGroup, chunkData.chunkX, chunkData.chunkZ, CHUNK_SIZE);
		}
	}

	/**
	 * Remove chunk from scene (FR-074: VIEW_DISTANCE management)
	 * @param chunkX Chunk X coordinate
	 * @param chunkZ Chunk Z coordinate
	 */
	public removeChunk(chunkX: number, chunkZ: number): void {
		const key = `${chunkX}_${chunkZ}`;
		const chunk = this.chunks.get(key);
		if (chunk) {
			this.scene.remove(chunk);
			this.chunks.delete(key);
		}
	}

	private setupEventListeners(): void {
		window.addEventListener('resize', this.onResize);
		window.addEventListener('keydown', this.onKeyDown);
		window.addEventListener('keyup', this.onKeyUp);
	}

	private onResize = (): void => {
		if (this.isDisposed) return;
		const width = this.container.clientWidth;
		const height = this.container.clientHeight;
		const aspect = width / height;
		const viewSize = 10;
		this.camera.left = -viewSize * aspect;
		this.camera.right = viewSize * aspect;
		this.camera.top = viewSize;
		this.camera.bottom = -viewSize;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width, height);
		this.labelRenderer.setSize(width, height);
	};

	/**
	 * 仕様: キーダウンイベントハンドラー
	 * - テキスト入力フィールド（input, textarea）にフォーカスがある場合は無視
	 * - contentEditable要素にフォーカスがある場合も無視
	 * - それ以外の場合のみキー入力を記録
	 * 修正日: 2025-12-14
	 * 修正内容: チャット入力中に矢印キーで移動してしまう問題を修正
	 */
	private onKeyDown = (e: KeyboardEvent): void => {
		// チャット入力などのテキストフィールドにフォーカスがある場合は移動キーを無視
		const target = e.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}
		this.keys.add(e.code);
	};

	private onKeyUp = (e: KeyboardEvent): void => {
		this.keys.delete(e.code);
	};

	private animate = (): void => {
		if (this.isDisposed) return;
		this.animationId = requestAnimationFrame(this.animate);

		// Calculate delta time
		const now = performance.now();
		const deltaTime = this.lastFrameTime > 0 ? (now - this.lastFrameTime) / 1000 : 0.016;
		this.lastFrameTime = now;

		/**
		 * 仕様: キーボード入力の状態をcurrentInputに反映
		 * - ジョイスティック入力がアクティブな場合: setInput()で設定された値を維持
		 * - キーボード入力のみの場合: keys Setの状態を反映
		 * 修正: キーを離した時にcurrentInputがリセットされない問題を修正
		 *       isJoystickActiveフラグを使用してジョイスティック入力時はキーボード処理をスキップ
		 * 修正日: 2025-12-14
		 */
		// ジョイスティック入力がアクティブな場合はsetInput()で設定された値を使用
		// キーボード入力のみの場合はkeys Setの状態を反映
		if (!this.isJoystickActive) {
			this.currentInput.up = this.keys.has('ArrowUp');
			this.currentInput.down = this.keys.has('ArrowDown');
			this.currentInput.left = this.keys.has('ArrowLeft');
			this.currentInput.right = this.keys.has('ArrowRight');
			this.currentInput.sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
		}

		// T088: Update character animations with input-based animation (like character-demo.html)
		// Note: Character.update() handles both movement and animation, but in Noctown,
		// movement is handled by index.vue. We only need animation updates here.
		if (this.localPlayer) {
			// Use currentInput to determine if player is moving
			const moveX = (this.currentInput.right ? 1 : 0) - (this.currentInput.left ? 1 : 0);
			const moveZ = (this.currentInput.down ? 1 : 0) - (this.currentInput.up ? 1 : 0);
			this.localPlayer.updateAnimation(moveX, moveZ, deltaTime);
		}

		/**
		 * 仕様: リモートプレイヤーのアニメーション更新
		 * - lerp位置を更新し、前フレームの位置との差分から移動方向を計算
		 * - 位置の保存はアニメーション更新後に行う（実際の描画位置を使用）
		 * 修正日: 2025-12-14
		 * 修正内容: updateRemotePlayerで目標位置を保存していたためlerp中に逆方向を計算していた問題を修正
		 */
		for (const [playerId, character] of this.remotePlayers) {
			// FR-070: Update lerp position for smooth WebSocket sync
			character.updateLerp();

			// Get current position (actual rendered position after lerp update)
			const currentPos = character.getPosition();
			const now = Date.now();

			const lastPos = this.remotePlayerLastPos.get(playerId);
			if (!lastPos) {
				// No previous position data - initialize and assume idle
				this.remotePlayerLastPos.set(playerId, {
					x: currentPos.x,
					z: currentPos.z,
					time: now,
				});
				character.updateAnimation(0, 0, deltaTime);
				continue;
			}

			const timeDiff = now - lastPos.time;

			// Calculate movement direction (if moved recently)
			let moveX = 0;
			let moveZ = 0;
			if (timeDiff < 500) { // Only animate if position updated within last 500ms
				const dx = currentPos.x - lastPos.x;
				const dz = currentPos.z - lastPos.z;
				const moveLength = Math.sqrt(dx * dx + dz * dz);

				// Lower threshold for remote players to ensure rotation updates
				if (moveLength > 0.0001) {
					moveX = dx / moveLength;
					moveZ = dz / moveLength;
				}
			}

			// Save current position for next frame's direction calculation
			this.remotePlayerLastPos.set(playerId, {
				x: currentPos.x,
				z: currentPos.z,
				time: now,
			});

			character.updateAnimation(moveX, moveZ, deltaTime);
		}

		// Update camera to follow player
		if (this.localPlayer) {
			const targetPos = this.localPlayer.group.position.clone().add(this.cameraOffset);
			this.camera.position.lerp(targetPos, 0.1);

			// Smoothly interpolate camera lookAt target to avoid sudden camera jerks
			this.cameraLookAtTarget.lerp(this.localPlayer.group.position, 0.1);
			this.camera.lookAt(this.cameraLookAtTarget);
		}

		// FR-008: 時間帯別ライティング更新
		this.updateLighting();

		// FR-022: ペットアニメーション更新
		if (this.petManager) {
			this.petManager.update();
		}

		this.renderer.render(this.scene, this.camera);
		this.labelRenderer.render(this.scene, this.camera);
	};

	// Player management
	public createLocalPlayer(data: PlayerData): void {
		if (this.localPlayer) {
			this.scene.remove(this.localPlayer.group);
		}

		// 自プレイヤーのIDを保存
		this.localPlayerId = data.id;

		// Create Character instance
		this.localPlayer = new Character();
		this.localPlayer.setPosition(data.positionX, data.positionY, data.positionZ);
		this.localPlayer.setRotation(data.rotation);
		this.localPlayer.setCastShadow(true);

		// T008, T009: Set player name and online status
		this.localPlayer.setName(data.username);
		this.localPlayer.setOnline(data.isOnline);

		// FR-017: Mark as local player (always green status mark)
		this.localPlayer.setAsLocalPlayer();

		// Set icon (always set, using identicon as fallback)
		this.localPlayer.setIcon(data.avatarUrl, data.username);

		this.scene.add(this.localPlayer.group);
	}

	public updateLocalPlayerPosition(x: number, y: number, z: number, rotation: number): void {
		if (!this.localPlayer) return;

		// Calculate movement direction from position change
		const oldPos = this.localPlayer.getPosition();
		const dx = x - oldPos.x;
		const dz = z - oldPos.z;
		const moveLength = Math.sqrt(dx * dx + dz * dz);

		// Normalize movement direction for animation
		if (moveLength > 0.001) {
			this.lastMoveDirection.x = dx / moveLength;
			this.lastMoveDirection.z = dz / moveLength;
		} else {
			this.lastMoveDirection.x = 0;
			this.lastMoveDirection.z = 0;
		}

		this.localPlayer.setPosition(x, y, z);
		this.localPlayer.setRotation(rotation);
	}

	// T014-T016: showLocalPlayerEmote updated for custom emoji support
	public showLocalPlayerEmote(emoji: string, isCustom?: boolean, url?: string): void {
		if (!this.localPlayer) return;
		this.localPlayer.showEmote(emoji, isCustom, url);
	}

	// T014-T016: showRemotePlayerEmote updated for custom emoji support
	public showRemotePlayerEmote(playerId: string, emoji: string, isCustom?: boolean, url?: string): void {
		const character = this.remotePlayers.get(playerId);
		if (!character) return;
		character.showEmote(emoji, isCustom, url);
	}

	public showLocalPlayerChat(message: string): void {
		if (!this.localPlayer) return;
		this.localPlayer.showChatMessage(message);
	}

	public showRemotePlayerChat(playerId: string, message: string): void {
		const character = this.remotePlayers.get(playerId);
		if (!character) return;
		character.showChatMessage(message);
	}

	// FR-019: Show/hide typing indicator for local player
	public showLocalPlayerTyping(isTyping: boolean): void {
		if (!this.localPlayer) return;
		this.localPlayer.showTypingIndicator(isTyping);
	}

	// FR-019: Show/hide typing indicator for remote player
	public showRemotePlayerTyping(playerId: string, isTyping: boolean): void {
		const character = this.remotePlayers.get(playerId);
		if (!character) return;
		character.showTypingIndicator(isTyping);
	}

	/**
	 * 仕様: ジョイスティック入力を設定
	 * - isJoystickActiveフラグをtrueにして、キーボード処理をスキップ
	 * 修正日: 2025-12-14
	 */
	public setInput(input: { up: boolean; down: boolean; left: boolean; right: boolean; sprint: boolean }): void {
		this.currentInput = { ...input };
		this.isJoystickActive = true;
	}

	/**
	 * 仕様: ジョイスティック入力をクリア（ジョイスティックを離した時に呼ぶ）
	 * - isJoystickActiveフラグをfalseにして、キーボード処理を再開
	 * - currentInputを全てfalseにリセット
	 * 修正日: 2025-12-14
	 */
	public clearInput(): void {
		this.currentInput = {
			up: false,
			down: false,
			left: false,
			right: false,
			sprint: false,
		};
		this.isJoystickActive = false;
	}

	/**
	 * 仕様: リモートプレイヤーを追加
	 * 修正: 自プレイヤーの判定を強化し、デバッグログを追加
	 * 修正日: 2025-12-14
	 */
	public addRemotePlayer(data: PlayerData): void {
		// デバッグログ: addRemotePlayer呼び出し内容を確認
		console.log('[addRemotePlayer] Called with:', {
			dataId: data.id,
			localPlayerId: this.localPlayerId,
			isLocalPlayer: data.id === this.localPlayerId,
			username: data.username,
			data,
		});

		// 自プレイヤーは追加しない
		if (data.id === this.localPlayerId) {
			console.warn('[addRemotePlayer] Attempted to add local player, skipping');
			return;
		}

		if (this.remotePlayers.has(data.id)) {
			console.log('[addRemotePlayer] Player already exists, updating instead:', data.id);
			this.updateRemotePlayer(data);
			return;
		}

		// Create Character instance
		const character = new Character();
		character.setPosition(data.positionX, data.positionY, data.positionZ);
		character.setRotation(data.rotation);
		character.setCastShadow(true);

		// FR-070: Enable linear interpolation for smooth WebSocket position sync
		character.enableLerp(100); // 100ms lerp duration

		// Set player name and online status
		character.setName(data.username);
		character.setOnline(data.isOnline);

		// Set icon (always set, using identicon as fallback)
		character.setIcon(data.avatarUrl, data.username);

		this.scene.add(character.group);
		this.remotePlayers.set(data.id, character);

		// FR-018: Store player data for info window
		this.remotePlayerData.set(data.id, data);

		// FR-022: Apply visual effects for offline players (NPC)
		if (!data.isOnline) {
			character.group.traverse((child) => {
				if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
					child.material.opacity = 0.7;
					child.material.transparent = true;
				}
			});
		}
	}

	/**
	 * 仕様: リモートプレイヤーの位置を更新
	 * 修正: 自プレイヤーの判定を強化し、デバッグログを追加
	 * 修正日: 2025-12-14
	 */
	public updateRemotePlayer(data: PlayerData): void {
		// デバッグログ: updateRemotePlayer呼び出し内容を確認
		console.log('[updateRemotePlayer] Called with:', {
			dataId: data.id,
			localPlayerId: this.localPlayerId,
			isLocalPlayer: data.id === this.localPlayerId,
			username: data.username,
			position: { x: data.positionX, y: data.positionY, z: data.positionZ },
			rotation: data.rotation,
		});

		// 自プレイヤーの位置は更新しない
		if (data.id === this.localPlayerId) {
			console.warn('[updateRemotePlayer] Attempted to update local player, skipping');
			return;
		}

		const character = this.remotePlayers.get(data.id);
		if (!character) {
			console.warn('[updateRemotePlayer] Character not found:', data.id);
			return;
		}

		// 仕様: リモートプレイヤーの位置を更新
		// 注意: 位置の保存はanimateループで行う（lerp中の実際の描画位置を使用するため）
		// 修正日: 2025-12-14
		character.setPosition(data.positionX, data.positionY, data.positionZ);

		// Update online status
		character.setOnline(data.isOnline);

		// FR-018: Update player data for info window
		this.remotePlayerData.set(data.id, data);
	}

	public removeRemotePlayer(playerId: string): void {

		// デバッグログ: removeRemotePlayer呼び出し内容を確認
		console.log('[removeRemotePlayer] Called with:', {
			playerId,
			localPlayerId: this.localPlayerId,
			isLocalPlayer: playerId === this.localPlayerId,
		});
		
		// 自プレイヤーは削除しない
		if (playerId === this.localPlayerId) {
			console.warn('[removeRemotePlayer] Attempted to remove local player, skipping');
			return;
		}

		const character = this.remotePlayers.get(playerId);
		if (character) {
			this.scene.remove(character.group);
			this.remotePlayers.delete(playerId);
			// FR-018: Remove player data for info window
			this.remotePlayerData.delete(playerId);
		}
	}

	// T018: Set player online/offline status with visual effects
	public setPlayerOnlineStatus(playerId: string, isOnline: boolean): void {
		const character = this.remotePlayers.get(playerId);
		if (!character) return;

		// Apply visual effects based on online status
		character.group.traverse((child) => {
			if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
				if (isOnline) {
					// Online: restore normal appearance
					child.material.opacity = 1.0;
					child.material.transparent = false;
				} else {
					// Offline: reduce opacity
					child.material.opacity = 0.7;
					child.material.transparent = true;
				}
			}
		});

		// Update player name sprite to show online/offline status
		character.setOnline(isOnline);
	}

	// FR-020: Get remote players map for checking existence
	public getRemotePlayers(): Map<string, Character> {
		return this.remotePlayers;
	}

	// FR-014: 表示中のプレイヤーIDリストを取得
	public getVisiblePlayerIds(): string[] {
		return Array.from(this.remotePlayers.keys());
	}

	// FR-017: Get remote player IDs for ping/pong
	public getRemotePlayerIds(): string[] {
		return Array.from(this.remotePlayers.keys());
	}

	// 指定されたプレイヤーIDがリモートプレイヤーとして存在するか確認
	public hasRemotePlayer(playerId: string): boolean {
		return this.remotePlayers.has(playerId);
	}

	// FR-017: Update remote player ping status and mark color
	public updateRemotePlayerPingStatus(playerId: string, responseTimeMs: number): void {
		const character = this.remotePlayers.get(playerId);
		if (!character) return;

		character.updatePingStatus(responseTimeMs);
	}

	// FR-017: Check all remote players for warning status (3+ seconds since last ping)
	public checkRemotePlayerWarnings(): void {
		for (const [playerId, character] of this.remotePlayers) {
			if (character.needsWarningColor()) {
				character.setWarningColor();
			}
		}
	}

	// Chunk management
	public loadChunk(data: ChunkData): void {
		const key = `${data.chunkX},${data.chunkZ}`;
		if (this.chunks.has(key)) return;

		const CHUNK_SIZE = 16;
		const group = new THREE.Group();
		group.position.set(data.chunkX * CHUNK_SIZE, 0, data.chunkZ * CHUNK_SIZE);

		// SC-013: Add grid helper for ground grid lines (character-demo+14-fishing準拠)
		const gridHelper = new THREE.GridHelper(CHUNK_SIZE, CHUNK_SIZE, 0x2a3a3a, 0x2a3a3a);
		gridHelper.position.set(CHUNK_SIZE / 2, 0.01, CHUNK_SIZE / 2); // Center in chunk, y=0.01 to avoid z-fighting
		group.add(gridHelper);

		// Check if terrainData is an array (new format) or object (old format)
		// 注意: 池・湖・農園プロットの生成はrenderChunk()で行うため、ここでは行わない
		if (Array.isArray(data.terrainData)) {
			// New format: terrainData is number[] (地形タイプ配列)
			// 地形メッシュの生成はrenderChunk()に委譲
		} else {
			// Old format: terrainData is { heightMap, version }
			const heightMap = data.terrainData.heightMap;
			if (heightMap && heightMap.length > 0) {
				const geometry = new THREE.PlaneGeometry(16, 16, 15, 15);
				const positions = geometry.attributes.position;

				for (let i = 0; i < positions.count; i++) {
					const x = Math.floor(i % 16);
					const z = Math.floor(i / 16);
					if (heightMap[x] && heightMap[x][z] !== undefined) {
						positions.setZ(i, heightMap[x][z] * 0.2);
					}
				}
				geometry.computeVertexNormals();

				const color = this.getBiomeColor(data.biome);
				const material = new THREE.MeshStandardMaterial({
					color,
					roughness: 0.8,
					flatShading: true,
				});

				const terrain = new THREE.Mesh(geometry, material);
				terrain.rotation.x = -Math.PI / 2;
				terrain.position.set(8, 0, 8);
				terrain.receiveShadow = true;
				group.add(terrain);
			}
		}

		// FR-010: Add environment objects from backend data (trees, flowers, etc.)
		if (data.environmentObjects && data.environmentObjects.length > 0) {
			const envRenderer = new ChunkEnvironmentRenderer();
			// heightMapを取得（terrainDataが配列形式の場合は仮の高さマップを使用）
			const heightMap: number[][] = [];
			if (Array.isArray(data.terrainData)) {
				// 仮の高さマップ（すべて8）
				for (let x = 0; x < CHUNK_SIZE; x++) {
					heightMap[x] = [];
					for (let z = 0; z < CHUNK_SIZE; z++) {
						heightMap[x][z] = 8;
					}
				}
			} else {
				// 旧形式のheightMapを使用
				for (let x = 0; x < CHUNK_SIZE; x++) {
					heightMap[x] = [];
					for (let z = 0; z < CHUNK_SIZE; z++) {
						heightMap[x][z] = data.terrainData.heightMap[x]?.[z] ?? 8;
					}
				}
			}
			envRenderer.addObjects(data.environmentObjects, data.chunkX, data.chunkZ, heightMap);
			group.add(envRenderer.getGroup());
		} else {
			// フォールバック: environmentObjectsがない場合はランダム生成
			addRandomEnvironmentEntities(this.scene, data.chunkX, data.chunkZ, 16);
		}

		this.scene.add(group);
		this.chunks.set(key, group);
	}

	private getBiomeColor(biome: string): number {
		switch (biome) {
			case 'forest': return 0x228b22;
			case 'plains': return 0x7cfc00;
			case 'desert': return 0xf4a460;
			case 'mountain': return 0x808080;
			case 'ocean': return 0x1e90ff;
			default: return 0x3d8c40;
		}
	}

	// Item management
	public addDroppedItem(data: DroppedItemData): void {
		if (this.droppedItems.has(data.id)) return;

		const geometry = new THREE.SphereGeometry(0.3, 16, 16);
		const material = new THREE.MeshStandardMaterial({
			color: this.getItemColor(data.itemType),
			emissive: this.getItemColor(data.itemType),
			emissiveIntensity: 0.3,
		});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(data.positionX, data.positionY + 0.5, data.positionZ);
		mesh.castShadow = true;
		mesh.userData = { type: 'droppedItem', data };
		this.scene.add(mesh);
		this.droppedItems.set(data.id, mesh);
	}

	public removeDroppedItem(itemId: string): void {
		const mesh = this.droppedItems.get(itemId);
		if (mesh) {
			this.scene.remove(mesh);
			this.droppedItems.delete(itemId);
		}
	}

	public addPlacedItem(data: PlacedItemData): void {
		if (this.placedItems.has(data.id)) return;

		const group = new THREE.Group();
		group.position.set(data.positionX, data.positionY, data.positionZ);
		group.rotation.y = data.rotation;

		// Create item mesh based on type
		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshStandardMaterial({
			color: this.getItemColor(data.itemType),
			roughness: 0.6,
		});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.y = 0.5;
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		group.add(mesh);

		group.userData = { type: 'placedItem', data };
		this.scene.add(group);
		this.placedItems.set(data.id, group);
	}

	public removePlacedItem(itemId: string): void {
		const group = this.placedItems.get(itemId);
		if (group) {
			this.scene.remove(group);
			this.placedItems.delete(itemId);
		}
	}

	public clearItems(): void {
		this.droppedItems.forEach((mesh) => this.scene.remove(mesh));
		this.droppedItems.clear();
		this.placedItems.forEach((group) => this.scene.remove(group));
		this.placedItems.clear();
	}

	private getItemColor(type: string): number {
		switch (type) {
			case 'tool': return 0x8b4513;
			case 'skin': return 0xff69b4;
			case 'placeable': return 0xffa500;
			case 'agent': return 0x00ff00;
			case 'seed': return 0x32cd32;
			case 'feed': return 0xffd700;
			default: return 0xc0c0c0;
		}
	}

	public getLocalPlayerPosition(): { x: number; y: number; z: number } | null {
		if (!this.localPlayer) return null;
		// Return Character position
		const pos = this.localPlayer.getPosition();
		return {
			x: pos.x,
			y: pos.y,
			z: pos.z,
		};
	}

	// NPC management
	public addNpc(data: NpcData): void {
		if (this.npcs.has(data.id)) return;

		const group = new THREE.Group();
		group.position.set(data.positionX, data.positionY, data.positionZ);

		// Create NPC body (slightly different color from players - purple tint)
		const geometry = new THREE.CapsuleGeometry(0.4, 1.2, 8, 16);
		const material = new THREE.MeshStandardMaterial({
			color: 0x9966cc, // Purple for NPCs
			roughness: 0.5,
		});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.y = 1;
		mesh.castShadow = true;
		group.add(mesh);

		// Add quest marker above NPC
		const markerGeometry = new THREE.ConeGeometry(0.3, 0.6, 4);
		const markerMaterial = new THREE.MeshStandardMaterial({
			color: 0xffcc00,
			emissive: 0xffcc00,
			emissiveIntensity: 0.5,
		});
		const marker = new THREE.Mesh(markerGeometry, markerMaterial);
		marker.position.y = 2.8;
		marker.rotation.x = Math.PI; // Point down
		group.add(marker);

		group.userData = { type: 'npc', data };
		this.scene.add(group);
		this.npcs.set(data.id, group);

		// Create name label
		this.createNpcLabel(data.id, data.username, group.position);
	}

	public removeNpc(npcId: string): void {
		const group = this.npcs.get(npcId);
		if (group) {
			this.scene.remove(group);
			this.npcs.delete(npcId);
		}

		const label = this.npcLabels.get(npcId);
		if (label) {
			this.scene.remove(label);
			this.npcLabels.delete(npcId);
		}
	}

	public clearNpcs(): void {
		this.npcs.forEach((group) => this.scene.remove(group));
		this.npcs.clear();
		this.npcLabels.forEach((label) => this.scene.remove(label));
		this.npcLabels.clear();
	}

	private createNpcLabel(npcId: string, username: string, position: THREE.Vector3): void {
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		if (!context) return;

		canvas.width = 256;
		canvas.height = 64;
		context.fillStyle = 'rgba(102, 51, 153, 0.7)'; // Purple background for NPCs
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.font = 'bold 24px sans-serif';
		context.fillStyle = 'white';
		context.textAlign = 'center';
		context.fillText(username, canvas.width / 2, canvas.height / 2 + 8);

		const texture = new THREE.CanvasTexture(canvas);
		const material = new THREE.SpriteMaterial({ map: texture });
		const sprite = new THREE.Sprite(material);
		sprite.scale.set(4, 1, 1);
		sprite.position.copy(position);
		sprite.position.y += 3.5;
		this.scene.add(sprite);
		this.npcLabels.set(npcId, sprite);
	}

	public getNpcAt(x: number, z: number, radius: number = 2): NpcData | null {
		for (const [, group] of this.npcs) {
			const dx = group.position.x - x;
			const dz = group.position.z - z;
			const distance = Math.sqrt(dx * dx + dz * dz);
			if (distance <= radius) {
				return group.userData.data as NpcData;
			}
		}
		return null;
	}

	// Input handling (WASD removed, arrow keys only)
	public getMovementInput(): { x: number; z: number; rotation: number } {
		let x = 0;
		let z = 0;

		if (this.keys.has('ArrowUp')) z -= 1;
		if (this.keys.has('ArrowDown')) z += 1;
		if (this.keys.has('ArrowLeft')) x -= 1;
		if (this.keys.has('ArrowRight')) x += 1;

		// Fix: Match character-demo+1-emotion.html rotation calculation (line 356)
		// this.targetRotation = Math.atan2(moveDir.x, moveDir.z);
		const rotation = Math.atan2(x, z);
		return { x, z, rotation };
	}

	public isMoving(): boolean {
		return this.keys.has('ArrowUp') || this.keys.has('ArrowDown') ||
			this.keys.has('ArrowLeft') || this.keys.has('ArrowRight');
	}

	// FR-016: Unload all chunks for full reload
	public unloadAllChunks(): void {
		for (const [key, group] of this.chunks) {
			// Dispose of all meshes in the chunk group
			group.traverse((obj) => {
				if (obj instanceof THREE.Mesh) {
					obj.geometry.dispose();
					if (obj.material instanceof THREE.Material) {
						obj.material.dispose();
					} else if (Array.isArray(obj.material)) {
						obj.material.forEach(m => m.dispose());
					}
				}
			});
			this.scene.remove(group);
		}
		this.chunks.clear();
	}

	// FR-016: Remove all remote players for full reload
	public removeAllRemotePlayers(): void {
		for (const [playerId, character] of this.remotePlayers) {
			this.scene.remove(character.group);
		}
		this.remotePlayers.clear();
		this.remotePlayerLastPos.clear();
		// FR-018: Clear player data for info window
		this.remotePlayerData.clear();
	}

	// FR-018: Get clicked player ID using Raycaster (supports both mouse and touch events)
	public getClickedPlayerId(event: MouseEvent | TouchEvent): string | null {
		// Convert mouse/touch coordinates to normalized device coordinates
		const rect = this.renderer.domElement.getBoundingClientRect();

		let clientX: number;
		let clientY: number;

		if ('touches' in event || 'changedTouches' in event) {
			// TouchEvent - use changedTouches for touchend
			const touch = (event as TouchEvent).changedTouches[0] || (event as TouchEvent).touches[0];
			if (!touch) return null;
			clientX = touch.clientX;
			clientY = touch.clientY;
		} else {
			// MouseEvent
			clientX = (event as MouseEvent).clientX;
			clientY = (event as MouseEvent).clientY;
		}

		this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
		this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

		// Set up raycaster
		this.raycaster.setFromCamera(this.mouse, this.camera);

		// Collect all remote player groups
		const playerGroups: THREE.Object3D[] = [];
		for (const [playerId, character] of this.remotePlayers) {
			playerGroups.push(character.group);
		}

		// Perform intersection test (recursive: true to check child meshes)
		const intersects = this.raycaster.intersectObjects(playerGroups, true);

		if (intersects.length > 0) {
			// Find which player was clicked by traversing parent hierarchy
			const clickedObject = intersects[0].object;
			for (const [playerId, character] of this.remotePlayers) {
				if (this.isDescendantOf(clickedObject, character.group)) {
					return playerId;
				}
			}
		}
		return null;
	}

	// FR-018: Helper to check if an object is a descendant of another
	private isDescendantOf(child: THREE.Object3D, parent: THREE.Object3D): boolean {
		let current: THREE.Object3D | null = child;
		while (current) {
			if (current === parent) return true;
			current = current.parent;
		}
		return false;
	}

	// FR-018: Get remote player data for info window
	public getRemotePlayerData(playerId: string): PlayerData | null {
		return this.remotePlayerData.get(playerId) || null;
	}

	// FR-018: Get renderer DOM element for event listener attachment
	public getRendererDomElement(): HTMLCanvasElement {
		return this.renderer.domElement;
	}

	// FR-022: ペット追加
	public addPet(pet: PetInfo): void {
		if (this.petManager) {
			this.petManager.addPet(pet);
		}
	}

	// FR-022: ペット削除
	public removePet(petId: string): void {
		if (this.petManager) {
			this.petManager.removePet(petId);
		}
	}

	// FR-022: 複数ペット追加
	public addPets(pets: PetInfo[]): void {
		if (this.petManager) {
			this.petManager.addPets(pets);
		}
	}

	// FR-022: ペット情報取得
	public getPetData(petId: string): PetInfo | null {
		return this.petManager?.getPet(petId) ?? null;
	}

	// FR-022: 全ペットIDを取得
	public getAllPetIds(): string[] {
		return this.petManager?.getAllPetIds() ?? [];
	}

	// FR-022: クリック位置のペットを取得
	public getClickedPet(event: MouseEvent | TouchEvent): PetInfo | null {
		if (!this.petManager) return null;

		const rect = this.renderer.domElement.getBoundingClientRect();

		let clientX: number;
		let clientY: number;

		if ('touches' in event || 'changedTouches' in event) {
			const touch = (event as TouchEvent).changedTouches[0] || (event as TouchEvent).touches[0];
			if (!touch) return null;
			clientX = touch.clientX;
			clientY = touch.clientY;
		} else {
			clientX = (event as MouseEvent).clientX;
			clientY = (event as MouseEvent).clientY;
		}

		this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
		this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

		return this.petManager.getClickedPet(this.raycaster, this.camera, this.mouse);
	}

	// FR-022: 近くのペットを取得
	public getNearbyPet(x: number, z: number, radius: number = 2): PetInfo | null {
		return this.petManager?.getNearbyPet(x, z, radius) ?? null;
	}

	public dispose(): void {
		this.isDisposed = true;

		if (this.animationId !== null) {
			cancelAnimationFrame(this.animationId);
		}

		window.removeEventListener('resize', this.onResize);
		window.removeEventListener('keydown', this.onKeyDown);
		window.removeEventListener('keyup', this.onKeyUp);

		// FR-022: ペット管理のクリーンアップ
		if (this.petManager) {
			this.petManager.dispose();
			this.petManager = null;
		}

		// Cleanup Three.js resources
		this.scene.traverse((object) => {
			if (object instanceof THREE.Mesh) {
				object.geometry.dispose();
				if (Array.isArray(object.material)) {
					object.material.forEach(m => m.dispose());
				} else {
					object.material.dispose();
				}
			}
		});

		this.renderer.dispose();
		this.container.removeChild(this.renderer.domElement);

		// Cleanup CSS2D renderer
		if (this.labelRenderer && this.labelRenderer.domElement.parentElement) {
			this.labelRenderer.domElement.parentElement.removeChild(this.labelRenderer.domElement);
		}
	}
}
