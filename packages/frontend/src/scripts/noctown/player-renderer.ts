/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

export interface SkinData {
	id: string;
	name: string;
	bodyColor?: number;
	headColor?: number;
	eyeColor?: number;
	accessoryType?: string;
	accessoryColor?: number;
	particleEffect?: string;
	particleColor?: number;
	scale?: number;
	glowEnabled?: boolean;
	glowColor?: number;
}

export interface PlayerData {
	id: string;
	userId: string;
	username: string;
	displayName: string;
	avatarUrl: string | null;
	positionX: number;
	positionY: number;
	positionZ: number;
	rotation: number;
	skinId: string | null;
	skinData: SkinData | null;
	isOnline: boolean;
}

interface PlayerMesh extends THREE.Group {
	userData: {
		playerId: string;
		userId: string;
		skinId: string | null;
		animationTime: number;
	};
}

// Default player colors
const DEFAULT_BODY_COLOR = 0x4a90d9;
const DEFAULT_HEAD_COLOR = 0xffdbac;
const DEFAULT_EYE_COLOR = 0x333333;

// Accessory types
type AccessoryType = 'hat' | 'glasses' | 'cape' | 'wings' | 'halo' | 'ears' | 'tail';

/**
 * Player character renderer with skin support.
 */
export class PlayerRenderer {
	private scene: THREE.Scene;
	private players: Map<string, PlayerMesh> = new Map();
	private particleSystems: Map<string, THREE.Points> = new Map();
	private glowMeshes: Map<string, THREE.Mesh> = new Map();
	private raycaster: THREE.Raycaster = new THREE.Raycaster();
	private terrainMeshes: THREE.Object3D[] = []; // T011: Reference to terrain meshes for raycasting

	constructor(scene: THREE.Scene) {
		this.scene = scene;
	}

	/**
	 * Set terrain meshes for Y position calculation (T011)
	 */
	public setTerrainMeshes(meshes: THREE.Object3D[]): void {
		this.terrainMeshes = meshes;
	}

	/**
	 * Calculate correct Y position using raycasting (T011, T012)
	 * @returns Y position (default: 1.5 if no terrain found)
	 */
	private calculateTerrainY(x: number, z: number): number {
		const DEFAULT_Y = 1.5; // T012: Default player Y position (ground level + character height)

		if (this.terrainMeshes.length === 0) {
			return DEFAULT_Y;
		}

		// Raycast from above to find terrain height
		const rayOrigin = new THREE.Vector3(x, 100, z);
		const rayDirection = new THREE.Vector3(0, -1, 0);
		this.raycaster.set(rayOrigin, rayDirection);

		const intersects = this.raycaster.intersectObjects(this.terrainMeshes, true);
		if (intersects.length > 0) {
			// Return terrain height + character height offset (1.5)
			return intersects[0].point.y + 1.5;
		}

		return DEFAULT_Y;
	}

	/**
	 * Create or update a player mesh.
	 */
	public setPlayer(data: PlayerData): void {
		let playerMesh = this.players.get(data.id);

		if (playerMesh) {
			// Check if skin changed
			if (playerMesh.userData.skinId !== data.skinId) {
				this.removePlayer(data.id);
				playerMesh = undefined;
			}
		}

		if (!playerMesh) {
			playerMesh = this.createPlayerMesh(data);
			this.players.set(data.id, playerMesh);
			this.scene.add(playerMesh);
		}

		// T011: Calculate correct Y position using raycasting
		const correctedY = this.calculateTerrainY(data.positionX, data.positionZ);

		// Update position with terrain-corrected Y
		playerMesh.position.set(data.positionX, correctedY, data.positionZ);
		playerMesh.rotation.y = data.rotation;
	}

	/**
	 * Create a new player mesh with optional skin.
	 */
	private createPlayerMesh(data: PlayerData): PlayerMesh {
		const group = new THREE.Group() as PlayerMesh;
		group.userData = {
			playerId: data.id,
			userId: data.userId,
			skinId: data.skinId,
			animationTime: 0,
		};

		const skin = data.skinData;
		const scale = skin?.scale ?? 1.0;

		// Body
		const bodyColor = skin?.bodyColor ?? DEFAULT_BODY_COLOR;
		const bodyGeometry = new THREE.CapsuleGeometry(0.3 * scale, 0.6 * scale, 4, 8);
		const bodyMaterial = new THREE.MeshStandardMaterial({
			color: bodyColor,
			roughness: 0.7,
			metalness: 0.1,
		});
		const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.y = 0.6 * scale;
		body.castShadow = true;
		group.add(body);

		// Head
		const headColor = skin?.headColor ?? DEFAULT_HEAD_COLOR;
		const headGeometry = new THREE.SphereGeometry(0.25 * scale, 16, 16);
		const headMaterial = new THREE.MeshStandardMaterial({
			color: headColor,
			roughness: 0.6,
			metalness: 0.0,
		});
		const head = new THREE.Mesh(headGeometry, headMaterial);
		head.position.y = 1.2 * scale;
		head.castShadow = true;
		head.name = 'head';
		group.add(head);

		// Eyes
		const eyeColor = skin?.eyeColor ?? DEFAULT_EYE_COLOR;
		const eyeGeometry = new THREE.SphereGeometry(0.05 * scale, 8, 8);
		const eyeMaterial = new THREE.MeshStandardMaterial({
			color: eyeColor,
			roughness: 0.3,
			metalness: 0.0,
		});

		const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
		leftEye.position.set(-0.08 * scale, 1.22 * scale, 0.2 * scale);
		group.add(leftEye);

		const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
		rightEye.position.set(0.08 * scale, 1.22 * scale, 0.2 * scale);
		group.add(rightEye);

		// Arms
		const armGeometry = new THREE.CapsuleGeometry(0.08 * scale, 0.4 * scale, 4, 8);
		const armMaterial = new THREE.MeshStandardMaterial({
			color: bodyColor,
			roughness: 0.7,
			metalness: 0.1,
		});

		const leftArm = new THREE.Mesh(armGeometry, armMaterial);
		leftArm.position.set(-0.4 * scale, 0.7 * scale, 0);
		leftArm.rotation.z = 0.2;
		leftArm.castShadow = true;
		leftArm.name = 'leftArm';
		group.add(leftArm);

		const rightArm = new THREE.Mesh(armGeometry, armMaterial);
		rightArm.position.set(0.4 * scale, 0.7 * scale, 0);
		rightArm.rotation.z = -0.2;
		rightArm.castShadow = true;
		rightArm.name = 'rightArm';
		group.add(rightArm);

		// Legs
		const legGeometry = new THREE.CapsuleGeometry(0.1 * scale, 0.35 * scale, 4, 8);
		const legMaterial = new THREE.MeshStandardMaterial({
			color: 0x333366,
			roughness: 0.8,
			metalness: 0.0,
		});

		const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
		leftLeg.position.set(-0.12 * scale, 0.2 * scale, 0);
		leftLeg.castShadow = true;
		leftLeg.name = 'leftLeg';
		group.add(leftLeg);

		const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
		rightLeg.position.set(0.12 * scale, 0.2 * scale, 0);
		rightLeg.castShadow = true;
		rightLeg.name = 'rightLeg';
		group.add(rightLeg);

		// Add accessories if skin has them
		if (skin?.accessoryType) {
			this.addAccessory(group, skin.accessoryType as AccessoryType, skin.accessoryColor ?? 0xffffff, scale);
		}

		// Add glow effect if enabled
		if (skin?.glowEnabled) {
			this.addGlowEffect(data.id, group, skin.glowColor ?? 0x00ffff, scale);
		}

		// Add particle effect if specified
		if (skin?.particleEffect) {
			this.addParticleEffect(data.id, group, skin.particleEffect, skin.particleColor ?? 0xffffff);
		}

		return group;
	}

	/**
	 * Add an accessory to the player.
	 */
	private addAccessory(group: THREE.Group, type: AccessoryType, color: number, scale: number): void {
		const material = new THREE.MeshStandardMaterial({
			color,
			roughness: 0.5,
			metalness: 0.3,
		});

		switch (type) {
			case 'hat': {
				const hatGeometry = new THREE.CylinderGeometry(0.2 * scale, 0.25 * scale, 0.15 * scale, 16);
				const hat = new THREE.Mesh(hatGeometry, material);
				hat.position.y = 1.45 * scale;
				group.add(hat);

				const brimGeometry = new THREE.CylinderGeometry(0.35 * scale, 0.35 * scale, 0.03 * scale, 16);
				const brim = new THREE.Mesh(brimGeometry, material);
				brim.position.y = 1.38 * scale;
				group.add(brim);
				break;
			}
			case 'glasses': {
				const frameGeometry = new THREE.TorusGeometry(0.06 * scale, 0.01 * scale, 8, 16);
				const leftFrame = new THREE.Mesh(frameGeometry, material);
				leftFrame.position.set(-0.08 * scale, 1.22 * scale, 0.22 * scale);
				leftFrame.rotation.y = Math.PI / 2;
				group.add(leftFrame);

				const rightFrame = new THREE.Mesh(frameGeometry, material);
				rightFrame.position.set(0.08 * scale, 1.22 * scale, 0.22 * scale);
				rightFrame.rotation.y = Math.PI / 2;
				group.add(rightFrame);

				const bridgeGeometry = new THREE.BoxGeometry(0.08 * scale, 0.01 * scale, 0.01 * scale);
				const bridge = new THREE.Mesh(bridgeGeometry, material);
				bridge.position.set(0, 1.22 * scale, 0.22 * scale);
				group.add(bridge);
				break;
			}
			case 'cape': {
				const capeGeometry = new THREE.PlaneGeometry(0.5 * scale, 0.8 * scale);
				const capeMaterial = new THREE.MeshStandardMaterial({
					color,
					roughness: 0.8,
					metalness: 0.0,
					side: THREE.DoubleSide,
				});
				const cape = new THREE.Mesh(capeGeometry, capeMaterial);
				cape.position.set(0, 0.7 * scale, -0.35 * scale);
				cape.rotation.x = 0.2;
				cape.name = 'cape';
				group.add(cape);
				break;
			}
			case 'wings': {
				const wingShape = new THREE.Shape();
				wingShape.moveTo(0, 0);
				wingShape.quadraticCurveTo(0.3 * scale, 0.2 * scale, 0.4 * scale, 0);
				wingShape.quadraticCurveTo(0.3 * scale, -0.3 * scale, 0, -0.2 * scale);
				wingShape.quadraticCurveTo(-0.1 * scale, -0.1 * scale, 0, 0);

				const wingGeometry = new THREE.ShapeGeometry(wingShape);
				const wingMaterial = new THREE.MeshStandardMaterial({
					color,
					roughness: 0.3,
					metalness: 0.5,
					side: THREE.DoubleSide,
					transparent: true,
					opacity: 0.8,
				});

				const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
				leftWing.position.set(-0.3 * scale, 0.8 * scale, -0.2 * scale);
				leftWing.rotation.y = Math.PI / 4;
				leftWing.name = 'leftWing';
				group.add(leftWing);

				const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
				rightWing.position.set(0.3 * scale, 0.8 * scale, -0.2 * scale);
				rightWing.rotation.y = -Math.PI / 4;
				rightWing.scale.x = -1;
				rightWing.name = 'rightWing';
				group.add(rightWing);
				break;
			}
			case 'halo': {
				const haloGeometry = new THREE.TorusGeometry(0.2 * scale, 0.02 * scale, 8, 32);
				const haloMaterial = new THREE.MeshStandardMaterial({
					color,
					emissive: color,
					emissiveIntensity: 0.5,
					roughness: 0.2,
					metalness: 0.8,
				});
				const halo = new THREE.Mesh(haloGeometry, haloMaterial);
				halo.position.y = 1.55 * scale;
				halo.rotation.x = Math.PI / 2;
				halo.name = 'halo';
				group.add(halo);
				break;
			}
			case 'ears': {
				const earGeometry = new THREE.ConeGeometry(0.08 * scale, 0.15 * scale, 4);

				const leftEar = new THREE.Mesh(earGeometry, material);
				leftEar.position.set(-0.15 * scale, 1.4 * scale, 0);
				leftEar.rotation.z = -0.3;
				group.add(leftEar);

				const rightEar = new THREE.Mesh(earGeometry, material);
				rightEar.position.set(0.15 * scale, 1.4 * scale, 0);
				rightEar.rotation.z = 0.3;
				group.add(rightEar);
				break;
			}
			case 'tail': {
				const tailGeometry = new THREE.CylinderGeometry(0.03 * scale, 0.06 * scale, 0.4 * scale, 8);
				const tail = new THREE.Mesh(tailGeometry, material);
				tail.position.set(0, 0.4 * scale, -0.35 * scale);
				tail.rotation.x = -0.8;
				tail.name = 'tail';
				group.add(tail);
				break;
			}
		}
	}

	/**
	 * Add glow effect around player.
	 */
	private addGlowEffect(playerId: string, group: THREE.Group, color: number, scale: number): void {
		const glowGeometry = new THREE.SphereGeometry(0.8 * scale, 16, 16);
		const glowMaterial = new THREE.MeshBasicMaterial({
			color,
			transparent: true,
			opacity: 0.15,
			side: THREE.BackSide,
		});
		const glow = new THREE.Mesh(glowGeometry, glowMaterial);
		glow.position.y = 0.7 * scale;
		group.add(glow);

		this.glowMeshes.set(playerId, glow);
	}

	/**
	 * Add particle effect around player.
	 */
	private addParticleEffect(playerId: string, group: THREE.Group, effectType: string, color: number): void {
		const particleCount = 20;
		const positions = new Float32Array(particleCount * 3);

		for (let i = 0; i < particleCount; i++) {
			const theta = Math.random() * Math.PI * 2;
			const r = 0.3 + Math.random() * 0.3;
			positions[i * 3] = r * Math.cos(theta);
			positions[i * 3 + 1] = Math.random() * 1.5;
			positions[i * 3 + 2] = r * Math.sin(theta);
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

		const material = new THREE.PointsMaterial({
			color,
			size: effectType === 'sparkle' ? 0.08 : 0.05,
			transparent: true,
			opacity: 0.8,
			blending: THREE.AdditiveBlending,
		});

		const particles = new THREE.Points(geometry, material);
		group.add(particles);

		this.particleSystems.set(playerId, particles);
	}

	/**
	 * Update player position smoothly.
	 */
	public updatePlayerPosition(playerId: string, x: number, y: number, z: number, rotation: number): void {
		const player = this.players.get(playerId);
		if (player) {
			// Smooth interpolation
			player.position.lerp(new THREE.Vector3(x, y, z), 0.3);
			player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, rotation, 0.3);
		}
	}

	/**
	 * T018: Update player visual effects based on online/offline status
	 * @param playerId Player ID
	 * @param isOnline Online status
	 */
	public setPlayerOnlineStatus(playerId: string, isOnline: boolean): void {
		const player = this.players.get(playerId);
		if (!player) return;

		// Apply visual effects for offline players
		if (isOnline) {
			// Online: restore normal appearance
			player.traverse((child) => {
				if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
					child.material.opacity = 1.0;
					child.material.transparent = false;
				}
			});
		} else {
			// Offline: reduce opacity and stop animations
			player.traverse((child) => {
				if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
					child.material.opacity = 0.7;
					child.material.transparent = true;
				}
			});

			// Stop animations by resetting animation time
			player.userData.animationTime = 0;
		}
	}

	/**
	 * Remove a player from the scene.
	 */
	public removePlayer(playerId: string): void {
		const player = this.players.get(playerId);
		if (player) {
			this.scene.remove(player);
			this.players.delete(playerId);
		}

		const particles = this.particleSystems.get(playerId);
		if (particles) {
			particles.geometry.dispose();
			(particles.material as THREE.Material).dispose();
			this.particleSystems.delete(playerId);
		}

		this.glowMeshes.delete(playerId);
	}

	/**
	 * Update animations and effects.
	 */
	public update(deltaTime: number): void {
		const time = Date.now() * 0.001;

		for (const [playerId, player] of this.players) {
			player.userData.animationTime += deltaTime;

			// Idle animation - subtle bobbing
			const head = player.getObjectByName('head');
			if (head) {
				head.position.y = 1.2 + Math.sin(time * 2) * 0.02;
			}

			// Wing animation
			const leftWing = player.getObjectByName('leftWing');
			const rightWing = player.getObjectByName('rightWing');
			if (leftWing && rightWing) {
				const wingFlap = Math.sin(time * 8) * 0.2;
				leftWing.rotation.y = Math.PI / 4 + wingFlap;
				rightWing.rotation.y = -Math.PI / 4 - wingFlap;
			}

			// Cape animation
			const cape = player.getObjectByName('cape');
			if (cape) {
				cape.rotation.x = 0.2 + Math.sin(time * 3) * 0.1;
			}

			// Tail animation
			const tail = player.getObjectByName('tail');
			if (tail) {
				tail.rotation.z = Math.sin(time * 4) * 0.3;
			}

			// Halo animation
			const halo = player.getObjectByName('halo');
			if (halo) {
				halo.position.y = 1.55 + Math.sin(time * 2) * 0.03;
			}

			// Update glow
			const glow = this.glowMeshes.get(playerId);
			if (glow && glow.material instanceof THREE.MeshBasicMaterial) {
				glow.material.opacity = 0.12 + Math.sin(time * 3) * 0.03;
			}

			// Update particles
			const particles = this.particleSystems.get(playerId);
			if (particles) {
				const positions = particles.geometry.attributes.position.array as Float32Array;
				for (let i = 0; i < positions.length / 3; i++) {
					positions[i * 3 + 1] += deltaTime * 0.5;
					if (positions[i * 3 + 1] > 1.8) {
						positions[i * 3 + 1] = 0;
					}
				}
				particles.geometry.attributes.position.needsUpdate = true;
			}
		}
	}

	/**
	 * Get player mesh.
	 */
	public getPlayer(playerId: string): THREE.Group | undefined {
		return this.players.get(playerId);
	}

	/**
	 * Get all player IDs.
	 */
	public getAllPlayerIds(): string[] {
		return Array.from(this.players.keys());
	}

	/**
	 * Check if player exists.
	 */
	public hasPlayer(playerId: string): boolean {
		return this.players.has(playerId);
	}

	/**
	 * Dispose all resources.
	 */
	public dispose(): void {
		for (const playerId of this.players.keys()) {
			this.removePlayer(playerId);
		}
	}
}
