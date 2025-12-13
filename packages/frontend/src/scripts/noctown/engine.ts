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

export interface PlayerData {
	id: string;
	userId: string;
	username: string;
	avatarUrl: string | null;
	positionX: number;
	positionY: number;
	positionZ: number;
	rotation: number;
	isOnline: boolean;
}

export interface EnvironmentObjectData {
	type: string;
	localX: number;
	localZ: number;
	variant?: number;
	scale?: number;
}

export interface ChunkData {
	chunkX: number;
	chunkZ: number;
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
	// Track remote player positions for movement direction calculation
	private remotePlayerLastPos: Map<string, { x: number; z: number; time: number }> = new Map();

	// World management
	private chunks: Map<string, THREE.Group> = new Map();

	// Item management
	private droppedItems: Map<string, THREE.Mesh> = new Map();
	private placedItems: Map<string, THREE.Group> = new Map();

	// NPC management
	private npcs: Map<string, THREE.Group> = new Map();
	private npcLabels: Map<string, THREE.Sprite> = new Map();

	// Camera follow
	private cameraOffset = new THREE.Vector3(0, 10, 15);

	// Input state
	private keys: Set<string> = new Set();
	private isDisposed = false;

	constructor(container: HTMLElement) {
		this.container = container;

		// Scene - Nocturne Theme (夜の月明かり)
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x0f1225); // 深い夜空
		this.scene.fog = new THREE.Fog(0x0f1225, 50, 120); // 霧で遠くを暗く（孤独感の演出）

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

		// Event listeners
		this.setupEventListeners();

		// Start render loop
		this.animate();
	}

	private setupLights(): void {
		// Nocturne Theme Lighting (夜の月明かり) - character-demo+14-fishing.html準拠

		// アンビエントライト（夜の静けさ、青みがかった暗さ）
		const ambient = new THREE.AmbientLight(0x3344666, 0.7);
		this.scene.add(ambient);

		// 月明かり（青白い光）
		const moonLight = new THREE.DirectionalLight(0x8899dd, 0.9);
		moonLight.position.set(10, 20, 10);
		moonLight.castShadow = true;
		moonLight.shadow.mapSize.width = 2048;
		moonLight.shadow.mapSize.height = 2048;
		moonLight.shadow.camera.near = 0.5;
		moonLight.shadow.camera.far = 50;
		moonLight.shadow.camera.left = -20;
		moonLight.shadow.camera.right = 20;
		moonLight.shadow.camera.top = 20;
		moonLight.shadow.camera.bottom = -20;
		this.scene.add(moonLight);

		// 月を追加
		const moonGeo = new THREE.SphereGeometry(3, 32, 32);
		const moonMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
		const moon = new THREE.Mesh(moonGeo, moonMat);
		moon.position.set(50, 60, -80);
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
		this.scene.add(moonGlow);

		// 星空を追加
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
		this.scene.add(stars);
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
		if (chunkData.terrainData && Array.isArray(chunkData.terrainData)) {
			const { createPondMesh } = await import('./pond.js');
			const { createLakeMesh } = await import('./lake.js');
			const { createFarmPlotMesh } = await import('./farm-plot.js');

			// terrainDataを走査して地形タイプに応じたメッシュを追加
			for (let x = 0; x < CHUNK_SIZE; x++) {
				for (let z = 0; z < CHUNK_SIZE; z++) {
					const terrainType = chunkData.terrainData[x * CHUNK_SIZE + z];
					const worldX = offsetX + x;
					const worldZ = offsetZ + z;
					const seed = worldX * 1000 + worldZ;

					if (terrainType === 1) {
						// FR-001: 池を生成
						const pond = createPondMesh(worldX, worldZ, seed);
						this.scene.add(pond);
					} else if (terrainType === 2) {
						// FR-001: 湖を生成
						const lake = createLakeMesh(worldX, worldZ, seed);
						this.scene.add(lake);
					} else if (terrainType === 3) {
						// FR-001: 農園プロットを生成
						const farmPlot = createFarmPlotMesh(worldX, worldZ);
						this.scene.add(farmPlot.group);
					}
				}
			}
		}

		this.scene.add(chunkGroup);
		this.chunks.set(key, chunkGroup);

		// FR-010: Add environment entities from backend data
		if (chunkData.environmentObjects && Array.isArray(chunkData.environmentObjects)) {
			const { addTree, addRock } = await import('./environment.js');
			for (const obj of chunkData.environmentObjects) {
				const worldX = offsetX + obj.localX;
				const worldZ = offsetZ + obj.localZ;

				if (obj.type === 'tree') {
					addTree(this.scene, worldX, worldZ);
				} else if (obj.type === 'rock') {
					const scale = obj.scale ?? 1.0;
					addRock(this.scene, worldX, worldZ, scale);
				}
			}
		} else {
			// Fallback: Use client-side generation if no backend data
			addRandomEnvironmentEntities(this.scene, chunkData.chunkX, chunkData.chunkZ, CHUNK_SIZE);
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

	private onKeyDown = (e: KeyboardEvent): void => {
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

		// Update currentInput from keyboard state (WASD removed, arrow keys only)
		this.currentInput.up = this.keys.has('ArrowUp');
		this.currentInput.down = this.keys.has('ArrowDown');
		this.currentInput.left = this.keys.has('ArrowLeft');
		this.currentInput.right = this.keys.has('ArrowRight');
		this.currentInput.sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');

		// T088: Update character animations with input-based animation (like character-demo.html)
		// Note: Character.update() handles both movement and animation, but in Noctown,
		// movement is handled by index.vue. We only need animation updates here.
		if (this.localPlayer) {
			// Use currentInput to determine if player is moving
			const moveX = (this.currentInput.right ? 1 : 0) - (this.currentInput.left ? 1 : 0);
			const moveZ = (this.currentInput.down ? 1 : 0) - (this.currentInput.up ? 1 : 0);
			this.localPlayer.updateAnimation(moveX, moveZ, deltaTime);
		}

		// Update remote player animations based on their movement
		for (const [playerId, character] of this.remotePlayers) {
			// FR-070: Update lerp position for smooth WebSocket sync
			character.updateLerp();

			const lastPos = this.remotePlayerLastPos.get(playerId);
			if (!lastPos) {
				// No previous position data, assume idle
				character.updateAnimation(0, 0, deltaTime);
				continue;
			}

			// Get current position
			const currentPos = character.getPosition();
			const now = Date.now();
			const timeDiff = now - lastPos.time;

			// Calculate movement direction (if moved recently)
			let moveX = 0;
			let moveZ = 0;
			if (timeDiff < 500) { // Only animate if position updated within last 500ms (increased from 200ms)
				const dx = currentPos.x - lastPos.x;
				const dz = currentPos.z - lastPos.z;
				const moveLength = Math.sqrt(dx * dx + dz * dz);

				// Lower threshold for remote players to ensure rotation updates
				if (moveLength > 0.0001) {
					moveX = dx / moveLength;
					moveZ = dz / moveLength;
				}
			}

			character.updateAnimation(moveX, moveZ, deltaTime);
		}

		// Update camera to follow player
		if (this.localPlayer) {
			const targetPos = this.localPlayer.group.position.clone().add(this.cameraOffset);
			this.camera.position.lerp(targetPos, 0.1);
			this.camera.lookAt(this.localPlayer.group.position);
		}

		this.renderer.render(this.scene, this.camera);
		this.labelRenderer.render(this.scene, this.camera);
	};

	// Player management
	public createLocalPlayer(data: PlayerData): void {
		if (this.localPlayer) {
			this.scene.remove(this.localPlayer.group);
		}

		// Create Character instance
		this.localPlayer = new Character();
		this.localPlayer.setPosition(data.positionX, data.positionY, data.positionZ);
		this.localPlayer.setRotation(data.rotation);
		this.localPlayer.setCastShadow(true);

		// T008, T009: Set player name and online status
		this.localPlayer.setName(data.username);
		this.localPlayer.setOnline(data.isOnline);

		// Set icon if available
		if (data.avatarUrl) {
			this.localPlayer.setIcon(data.avatarUrl);
		}

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

	public showLocalPlayerEmote(emoji: string): void {
		if (!this.localPlayer) return;
		this.localPlayer.showEmote(emoji);
	}

	public showRemotePlayerEmote(playerId: string, emoji: string): void {
		const character = this.remotePlayers.get(playerId);
		if (!character) return;
		character.showEmote(emoji);
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

	public setInput(input: { up: boolean; down: boolean; left: boolean; right: boolean; sprint: boolean }): void {
		this.currentInput = { ...input };
	}

	public addRemotePlayer(data: PlayerData): void {
		if (this.remotePlayers.has(data.id)) {
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

		// Set icon if available
		if (data.avatarUrl) {
			character.setIcon(data.avatarUrl);
		}

		this.scene.add(character.group);
		this.remotePlayers.set(data.id, character);

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

	public updateRemotePlayer(data: PlayerData): void {
		const character = this.remotePlayers.get(data.id);
		if (!character) return;

		// Get previous position to calculate movement direction
		const lastPos = this.remotePlayerLastPos.get(data.id);
		const now = Date.now();

		// Store current position for next update
		this.remotePlayerLastPos.set(data.id, {
			x: data.positionX,
			z: data.positionZ,
			time: now,
		});

		character.setPosition(data.positionX, data.positionY, data.positionZ);

		// Let Character.updateAnimation() handle rotation based on movement direction
		// This prevents rotation jitter from frequent WebSocket updates
		// Rotation is calculated in animate() loop (lines 327-357) from position deltas

		// Update online status
		character.setOnline(data.isOnline);
	}

	public removeRemotePlayer(playerId: string): void {
		const character = this.remotePlayers.get(playerId);
		if (character) {
			this.scene.remove(character.group);
			this.remotePlayers.delete(playerId);
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

	// Chunk management
	public loadChunk(data: ChunkData): void {
		const key = `${data.chunkX},${data.chunkZ}`;
		if (this.chunks.has(key)) return;

		const group = new THREE.Group();
		group.position.set(data.chunkX * 16, 0, data.chunkZ * 16);

		// Check if terrainData is an array (new format) or object (old format)
		if (Array.isArray(data.terrainData)) {
			// New format: terrainData is number[] (地形タイプ配列)
			const terrainTypes = data.terrainData;

			for (let i = 0; i < terrainTypes.length; i++) {
				const terrainType = terrainTypes[i];
				const localX = i % 16;
				const localZ = Math.floor(i / 16);

				// seed値の計算（チャンク座標から決定論的に生成）
				const worldX = data.chunkX * 16 + localX;
				const worldZ = data.chunkZ * 16 + localZ;
				const seed = worldX * 1000 + worldZ;

				if (terrainType === 1) {
					// 池を生成
					const pond = createPondMesh(localX, localZ, seed);
					group.add(pond);
				} else if (terrainType === 2) {
					// 湖を生成
					const lake = createLakeMesh(localX, localZ, seed);
					group.add(lake);
				} else if (terrainType === 3) {
					// 農園プロットを生成
					const farmPlot = createFarmPlotMesh(localX, localZ);
					group.add(farmPlot.group);
				}
				// terrainType === 0（草原）は既存のグラス生成ロジックで処理
			}
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

		this.scene.add(group);
		this.chunks.set(key, group);

		// T085: Add random environment entities (trees, rocks) to chunk
		addRandomEnvironmentEntities(this.scene, data.chunkX, data.chunkZ, 16);
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

	public dispose(): void {
		this.isDisposed = true;

		if (this.animationId !== null) {
			cancelAnimationFrame(this.animationId);
		}

		window.removeEventListener('resize', this.onResize);
		window.removeEventListener('keydown', this.onKeyDown);
		window.removeEventListener('keyup', this.onKeyUp);

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
