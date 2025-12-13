/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Character } from './character.js';
import { addRandomEnvironmentEntities } from './environment.js';

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

export interface ChunkData {
	chunkX: number;
	chunkZ: number;
	terrainData: {
		heightMap: number[][];
		version: number;
	};
	biome: string;
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
	private playerLabels: Map<string, CSS2DObject> = new Map();
	private lastMoveDirection: { x: number; z: number } = { x: 0, z: 0 };
	private lastFrameTime: number = 0;

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

		// Scene
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
		this.scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

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
		// Ambient light (character-demo.html style)
		const ambient = new THREE.AmbientLight(0xffffff, 0.6);
		this.scene.add(ambient);

		// Directional light (sun) with shadow configuration
		const sun = new THREE.DirectionalLight(0xffffff, 0.8);
		sun.position.set(10, 20, 10);
		sun.castShadow = true;
		sun.shadow.mapSize.width = 2048;
		sun.shadow.mapSize.height = 2048;
		sun.shadow.camera.near = 0.5;
		sun.shadow.camera.far = 50;
		sun.shadow.camera.left = -20;
		sun.shadow.camera.right = 20;
		sun.shadow.camera.top = 20;
		sun.shadow.camera.bottom = -20;
		this.scene.add(sun);
	}

	private createGroundPlane(): void {
		const geometry = new THREE.PlaneGeometry(500, 500);
		const material = new THREE.MeshStandardMaterial({
			color: 0x3d8c40,
			roughness: 0.8,
		});
		const ground = new THREE.Mesh(geometry, material);
		ground.rotation.x = -Math.PI / 2;
		ground.position.y = 0;
		ground.receiveShadow = true;
		this.scene.add(ground);
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

		// T088: Update character animations with movement direction and delta time
		if (this.localPlayer) {
			this.localPlayer.updateAnimation(
				this.lastMoveDirection.x,
				this.lastMoveDirection.z,
				deltaTime,
			);
		}

		// Update remote player animations (no movement direction, just idle animation)
		for (const [, character] of this.remotePlayers) {
			character.updateAnimation(0, 0, deltaTime);
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

		// Set icon if available
		if (data.avatarUrl) {
			character.setIcon(data.avatarUrl);
		}

		this.scene.add(character.group);
		this.remotePlayers.set(data.id, character);

		// Create name label
		const labelObject = this.createPlayerLabel(data.id, data.username, data.avatarUrl, data.isOnline, character.group.position);
		character.group.add(labelObject);
	}

	public updateRemotePlayer(data: PlayerData): void {
		const character = this.remotePlayers.get(data.id);
		if (!character) return;

		character.setPosition(data.positionX, data.positionY, data.positionZ);
		character.setRotation(data.rotation);

		// Update label data
		this.updatePlayerLabel(data.id, {
			username: data.username,
			avatarUrl: data.avatarUrl,
			isOnline: data.isOnline,
		});
	}

	public removeRemotePlayer(playerId: string): void {
		const character = this.remotePlayers.get(playerId);
		if (character) {
			this.scene.remove(character.group);
			this.remotePlayers.delete(playerId);
		}

		const label = this.playerLabels.get(playerId);
		if (label) {
			this.scene.remove(label);
			this.playerLabels.delete(playerId);
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

		// Update player label to show online/offline status
		this.updatePlayerLabel(playerId, { isOnline });
	}

	public createPlayerLabel(playerId: string, username: string, avatarUrl: string | null, isOnline: boolean, position: THREE.Vector3): CSS2DObject {
		// Create a div element for the label that matches NoctownPlayerLabel component structure
		const labelDiv = document.createElement('div');
		labelDiv.className = 'player-label-wrapper';
		labelDiv.setAttribute('data-player-id', playerId);
		labelDiv.style.pointerEvents = 'none';

		// Build the HTML structure to match NoctownPlayerLabel.vue
		const statusColor = isOnline ? '#22c55e' : '#ef4444'; // green/red

		labelDiv.innerHTML = `
			<div style="
				display: flex;
				align-items: center;
				gap: 6px;
				padding: 4px 8px;
				background-color: rgba(0, 0, 0, 0.7);
				border-radius: 12px;
				font-size: 12px;
				color: white;
				white-space: nowrap;
			">
				<div style="
					width: 8px;
					height: 8px;
					border-radius: 50%;
					flex-shrink: 0;
					background-color: ${statusColor};
				" data-status-mark></div>
				${avatarUrl ? `
					<img src="${avatarUrl}" alt="${username}" style="
						width: 20px;
						height: 20px;
						border-radius: 50%;
						object-fit: cover;
						flex-shrink: 0;
					" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
					<div style="
						width: 20px;
						height: 20px;
						display: none;
						align-items: center;
						justify-content: center;
						font-size: 16px;
						flex-shrink: 0;
					">👤</div>
				` : `
					<div style="
						width: 20px;
						height: 20px;
						display: flex;
						align-items: center;
						justify-content: center;
						font-size: 16px;
						flex-shrink: 0;
					">👤</div>
				`}
				<div style="
					font-weight: 500;
					max-width: 120px;
					overflow: hidden;
					text-overflow: ellipsis;
				" data-username>${username}</div>
			</div>
		`;

		const labelObject = new CSS2DObject(labelDiv);
		labelObject.position.copy(position);
		labelObject.position.y += 2;

		this.playerLabels.set(playerId, labelObject);
		return labelObject;
	}

	public updatePlayerLabel(playerId: string, data: Partial<{ username: string; avatarUrl: string | null; isOnline: boolean }>): void {
		const labelObject = this.playerLabels.get(playerId);
		if (!labelObject) return;

		const labelDiv = labelObject.element as HTMLDivElement;

		// Update status color
		if (data.isOnline !== undefined) {
			const statusMark = labelDiv.querySelector('[data-status-mark]') as HTMLDivElement;
			if (statusMark) {
				statusMark.style.backgroundColor = data.isOnline ? '#22c55e' : '#ef4444';
			}
		}

		// Update username
		if (data.username !== undefined) {
			const usernameEl = labelDiv.querySelector('[data-username]') as HTMLDivElement;
			if (usernameEl) {
				usernameEl.textContent = data.username;
			}
		}

		// Avatar update is more complex and not commonly needed, skip for now
	}

	// Chunk management
	public loadChunk(data: ChunkData): void {
		const key = `${data.chunkX},${data.chunkZ}`;
		if (this.chunks.has(key)) return;

		const group = new THREE.Group();
		group.position.set(data.chunkX * 16, 0, data.chunkZ * 16);

		// Create terrain from height map
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

	// Input handling
	public getMovementInput(): { x: number; z: number; rotation: number } {
		let x = 0;
		let z = 0;

		if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) z -= 1;
		if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) z += 1;
		if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
		if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;

		const rotation = Math.atan2(x, -z);
		return { x, z, rotation };
	}

	public isMoving(): boolean {
		return this.keys.has('KeyW') || this.keys.has('KeyS') ||
			this.keys.has('KeyA') || this.keys.has('KeyD') ||
			this.keys.has('ArrowUp') || this.keys.has('ArrowDown') ||
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
