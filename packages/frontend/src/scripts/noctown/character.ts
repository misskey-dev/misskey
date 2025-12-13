/**
 * Character class - 3D character model with animations
 * Based on character-demo.html implementation
 *
 * Features:
 * - BoxGeometry body parts (torso, head, arms, legs)
 * - Pivot groups for limb animation
 * - Head texture support (6 materials, front face = icon)
 * - Directional rotation (Math.atan2)
 * - Walk animation (Math.sin limb rotation)
 * - Idle animation (neutral pose)
 */

import * as THREE from 'three';

interface CharacterInput {
	up: boolean;
	down: boolean;
	left: boolean;
	right: boolean;
	sprint: boolean;
}

export class Character {
	public group: THREE.Group;
	private velocity: THREE.Vector3;
	private targetRotation: number;
	private isMoving: boolean;
	private walkCycle: number;
	private speed: number;
	private lastPosition: THREE.Vector3;
	private lastUpdateTime: number;

	// Body parts
	private torso!: THREE.Mesh;
	private head!: THREE.Mesh;
	private headMaterials: THREE.Material[];

	// Limbs with pivot groups
	private leftArmPivot!: THREE.Group;
	private leftArm!: THREE.Mesh;
	private rightArmPivot!: THREE.Group;
	private rightArm!: THREE.Mesh;
	private leftLegPivot!: THREE.Group;
	private leftLeg!: THREE.Mesh;
	private rightLegPivot!: THREE.Group;
	private rightLeg!: THREE.Mesh;

	// Emotion sprite
	private emoteSprite!: THREE.Sprite;
	private emoteCanvas!: HTMLCanvasElement;
	private emoteContext!: CanvasRenderingContext2D;
	private emoteTexture!: THREE.CanvasTexture;
	private emoteTimer: number = 0;
	private emoteDuration: number = 2.0;
	private emoteScale: number = 0;

	constructor() {
		this.group = new THREE.Group();
		this.velocity = new THREE.Vector3();
		this.targetRotation = 0;
		this.isMoving = false;
		this.walkCycle = 0;
		this.speed = 5;
		this.lastPosition = new THREE.Vector3();
		this.lastUpdateTime = Date.now();

		// Initialize head materials array (6 faces)
		this.headMaterials = [];

		this.createBody();
		this.createEmoteSprite();
	}

	private createBody(): void {
		const bodyColor = 0x4a90d9;
		const skinColor = 0xffdbac;

		// Torso (body)
		const torsoGeo = new THREE.BoxGeometry(0.8, 1, 0.5);
		const torsoMat = new THREE.MeshStandardMaterial({ color: bodyColor });
		this.torso = new THREE.Mesh(torsoGeo, torsoMat);
		this.torso.position.y = 1.5;
		this.torso.castShadow = true;
		this.group.add(this.torso);

		// Head (cube with 6 materials for icon texture)
		const headGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);

		// Create materials array for each face
		// Order: +X (right), -X (left), +Y (top), -Y (bottom), +Z (front), -Z (back)
		this.headMaterials = [
			new THREE.MeshStandardMaterial({ color: skinColor }), // right
			new THREE.MeshStandardMaterial({ color: skinColor }), // left
			new THREE.MeshStandardMaterial({ color: skinColor }), // top
			new THREE.MeshStandardMaterial({ color: skinColor }), // bottom
			new THREE.MeshStandardMaterial({ color: skinColor }), // front (icon goes here)
			new THREE.MeshStandardMaterial({ color: skinColor }), // back
		];

		this.head = new THREE.Mesh(headGeo, this.headMaterials);
		this.head.position.y = 2.55;
		this.head.castShadow = true;
		this.group.add(this.head);

		// Arms with pivot groups
		const armGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
		const armMat = new THREE.MeshStandardMaterial({ color: skinColor });

		// Left arm pivot
		this.leftArmPivot = new THREE.Group();
		this.leftArmPivot.position.set(-0.55, 1.9, 0);
		this.leftArm = new THREE.Mesh(armGeo, armMat.clone());
		this.leftArm.position.y = -0.4;
		this.leftArm.castShadow = true;
		this.leftArmPivot.add(this.leftArm);
		this.group.add(this.leftArmPivot);

		// Right arm pivot
		this.rightArmPivot = new THREE.Group();
		this.rightArmPivot.position.set(0.55, 1.9, 0);
		this.rightArm = new THREE.Mesh(armGeo, armMat.clone());
		this.rightArm.position.y = -0.4;
		this.rightArm.castShadow = true;
		this.rightArmPivot.add(this.rightArm);
		this.group.add(this.rightArmPivot);

		// Legs with pivot groups
		const legGeo = new THREE.BoxGeometry(0.3, 0.8, 0.3);
		const legMat = new THREE.MeshStandardMaterial({ color: 0x2d2d4a });

		// Left leg pivot
		this.leftLegPivot = new THREE.Group();
		this.leftLegPivot.position.set(-0.2, 1, 0);
		this.leftLeg = new THREE.Mesh(legGeo, legMat.clone());
		this.leftLeg.position.y = -0.4;
		this.leftLeg.castShadow = true;
		this.leftLegPivot.add(this.leftLeg);
		this.group.add(this.leftLegPivot);

		// Right leg pivot
		this.rightLegPivot = new THREE.Group();
		this.rightLegPivot.position.set(0.2, 1, 0);
		this.rightLeg = new THREE.Mesh(legGeo, legMat.clone());
		this.rightLeg.position.y = -0.4;
		this.rightLeg.castShadow = true;
		this.rightLegPivot.add(this.rightLeg);
		this.group.add(this.rightLegPivot);
	}

	/**
	 * Create emotion sprite above character head
	 */
	private createEmoteSprite(): void {
		// Create 128x128 canvas for emotion bubble
		this.emoteCanvas = document.createElement('canvas');
		this.emoteCanvas.width = 128;
		this.emoteCanvas.height = 128;
		this.emoteContext = this.emoteCanvas.getContext('2d')!;

		// Create texture from canvas
		this.emoteTexture = new THREE.CanvasTexture(this.emoteCanvas);
		this.emoteTexture.minFilter = THREE.LinearFilter;
		this.emoteTexture.magFilter = THREE.LinearFilter;

		// Create sprite material
		const material = new THREE.SpriteMaterial({
			map: this.emoteTexture,
			transparent: true,
			opacity: 0,
		});

		// Create sprite
		this.emoteSprite = new THREE.Sprite(material);
		this.emoteSprite.position.y = 4; // Above head
		this.emoteSprite.scale.set(1.5, 1.5, 1);
		this.emoteSprite.visible = false;
		this.group.add(this.emoteSprite);
	}

	/**
	 * Show emotion above character head
	 * @param emoji Emoji character to display (😊❗❓💢💕👋)
	 */
	public showEmote(emoji: string): void {
		// Reset timer and make sprite visible
		this.emoteTimer = 0;
		this.emoteSprite.visible = true;

		// Clear canvas
		this.emoteContext.clearRect(0, 0, 128, 128);

		// Draw white circle background
		this.emoteContext.fillStyle = '#ffffff';
		this.emoteContext.beginPath();
		this.emoteContext.arc(64, 54, 40, 0, Math.PI * 2);
		this.emoteContext.fill();

		// Draw black border
		this.emoteContext.strokeStyle = '#000000';
		this.emoteContext.lineWidth = 3;
		this.emoteContext.beginPath();
		this.emoteContext.arc(64, 54, 40, 0, Math.PI * 2);
		this.emoteContext.stroke();

		// Draw triangle tail at bottom
		this.emoteContext.fillStyle = '#ffffff';
		this.emoteContext.beginPath();
		this.emoteContext.moveTo(64, 94);
		this.emoteContext.lineTo(54, 104);
		this.emoteContext.lineTo(74, 104);
		this.emoteContext.closePath();
		this.emoteContext.fill();
		this.emoteContext.stroke();

		// Draw emoji
		this.emoteContext.font = '48px Arial';
		this.emoteContext.textAlign = 'center';
		this.emoteContext.textBaseline = 'middle';
		this.emoteContext.fillText(emoji, 64, 54);

		// Update texture
		this.emoteTexture.needsUpdate = true;
	}

	/**
	 * Set icon texture on head front face
	 * @param url Icon image URL
	 */
	public setIcon(url: string): void {
		const loader = new THREE.TextureLoader();
		loader.crossOrigin = 'anonymous';
		loader.load(
			url,
			(texture) => {
				texture.minFilter = THREE.LinearFilter;
				texture.magFilter = THREE.LinearFilter;
				// Apply to front face (index 4 = +Z)
				this.headMaterials[4] = new THREE.MeshStandardMaterial({
					map: texture,
					roughness: 0.5,
				});
				this.head.material = this.headMaterials;
			},
			undefined,
			(err) => {
				console.log('Icon load failed, using default color');
			},
		);
	}

	/**
	 * Update character with input and delta time
	 * @param deltaTime Time since last frame (seconds)
	 * @param input Movement input
	 */
	public update(deltaTime: number, input: CharacterInput): void {
		// Calculate movement direction
		const moveDir = new THREE.Vector3();

		if (input.up) moveDir.z -= 1;
		if (input.down) moveDir.z += 1;
		if (input.left) moveDir.x -= 1;
		if (input.right) moveDir.x += 1;

		this.isMoving = moveDir.length() > 0;

		if (this.isMoving) {
			moveDir.normalize();

			// Apply speed (with sprint)
			const currentSpeed = input.sprint ? this.speed * 1.8 : this.speed;
			this.velocity.copy(moveDir).multiplyScalar(currentSpeed * deltaTime);

			// Move character
			this.group.position.add(this.velocity);

			// Rotate to face movement direction
			this.targetRotation = Math.atan2(moveDir.x, moveDir.z);

			// Walk animation
			const walkSpeed = input.sprint ? 18 : 12;
			this.walkCycle += deltaTime * walkSpeed;
			const swing = Math.sin(this.walkCycle) * 0.6;

			this.leftArmPivot.rotation.x = swing;
			this.rightArmPivot.rotation.x = -swing;
			this.leftLegPivot.rotation.x = -swing;
			this.rightLegPivot.rotation.x = swing;

			// Subtle body bob
			this.torso.position.y = 1.5 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.05;
			this.head.position.y = 2.55 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.05;
		} else {
			// Idle - return to neutral pose
			this.walkCycle = 0;
			this.leftArmPivot.rotation.x *= 0.85;
			this.rightArmPivot.rotation.x *= 0.85;
			this.leftLegPivot.rotation.x *= 0.85;
			this.rightLegPivot.rotation.x *= 0.85;

			this.torso.position.y = 1.5;
			this.head.position.y = 2.55;
		}

		// Smooth rotation
		let rotDiff = this.targetRotation - this.group.rotation.y;
		while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
		while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
		this.group.rotation.y += rotDiff * 0.15;
	}

	/**
	 * Set character position
	 * @param x X coordinate
	 * @param y Y coordinate
	 * @param z Z coordinate
	 */
	public setPosition(x: number, y: number, z: number): void {
		this.group.position.set(x, y, z);
	}

	/**
	 * Update animation based on movement direction (improved smooth animation)
	 * @param moveX Normalized movement direction X (-1 to 1)
	 * @param moveZ Normalized movement direction Z (-1 to 1)
	 * @param deltaTime Delta time in seconds
	 */
	public updateAnimation(moveX: number = 0, moveZ: number = 0, deltaTime: number = 0.016): void {
		// Determine if moving based on movement input
		const moveLength = Math.sqrt(moveX * moveX + moveZ * moveZ);
		this.isMoving = moveLength > 0.01;

		if (this.isMoving) {
			// Calculate target rotation from movement direction
			this.targetRotation = Math.atan2(moveX, moveZ);

			// Walk animation with smooth cycle
			const walkSpeed = 12;
			this.walkCycle += deltaTime * walkSpeed;
			const swing = Math.sin(this.walkCycle) * 0.6;

			this.leftArmPivot.rotation.x = swing;
			this.rightArmPivot.rotation.x = -swing;
			this.leftLegPivot.rotation.x = -swing;
			this.rightLegPivot.rotation.x = swing;

			// Subtle body bob
			this.torso.position.y = 1.5 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.05;
			this.head.position.y = 2.55 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.05;
		} else {
			// Idle - return to neutral pose smoothly
			this.walkCycle = 0;
			this.leftArmPivot.rotation.x *= 0.85;
			this.rightArmPivot.rotation.x *= 0.85;
			this.leftLegPivot.rotation.x *= 0.85;
			this.rightLegPivot.rotation.x *= 0.85;

			this.torso.position.y = 1.5;
			this.head.position.y = 2.55;
		}

		// Smooth rotation towards target
		let rotDiff = this.targetRotation - this.group.rotation.y;
		while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
		while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
		this.group.rotation.y += rotDiff * 0.15;

		// Update emotion animation if visible
		if (this.emoteSprite.visible) {
			this.emoteTimer += deltaTime;
			const t = this.emoteTimer;
			const material = this.emoteSprite.material as THREE.SpriteMaterial;

			if (t < 0.125) {
				// Pop-in phase (0 - 0.125s): scale 0 → 1.5
				const progress = t / 0.125;
				this.emoteScale = progress * 1.5;
				material.opacity = 1;
			} else if (t < 1.7) {
				// Bounce phase (0.125 - 1.7s): slight bounce effect
				this.emoteScale = 1.5 + Math.sin((t - 0.125) * 10) * 0.1;
				material.opacity = 1;
			} else if (t < this.emoteDuration) {
				// Fade-out phase (1.7 - 2.0s): opacity 1 → 0
				const fadeProgress = (t - 1.7) / (this.emoteDuration - 1.7);
				this.emoteScale = 1.5;
				material.opacity = 1 - fadeProgress;
			} else {
				// Animation complete - hide sprite
				this.emoteSprite.visible = false;
				material.opacity = 0;
			}

			// Apply scale
			this.emoteSprite.scale.set(this.emoteScale, this.emoteScale, 1);
		}
	}

	/**
	 * Set character rotation
	 * @param rotation Rotation angle in radians
	 */
	public setRotation(rotation: number): void {
		this.targetRotation = rotation;
		this.group.rotation.y = rotation;
	}

	/**
	 * Get character position
	 */
	public getPosition(): THREE.Vector3 {
		return this.group.position.clone();
	}

	/**
	 * Get character rotation
	 */
	public getRotation(): number {
		return this.group.rotation.y;
	}

	/**
	 * Enable/disable shadow casting for all meshes
	 * @param enabled Cast shadow enabled
	 */
	public setCastShadow(enabled: boolean): void {
		this.torso.castShadow = enabled;
		this.head.castShadow = enabled;
		this.leftArm.castShadow = enabled;
		this.rightArm.castShadow = enabled;
		this.leftLeg.castShadow = enabled;
		this.rightLeg.castShadow = enabled;
	}

	/**
	 * Dispose character resources
	 */
	public dispose(): void {
		// Dispose geometries
		this.torso.geometry.dispose();
		this.head.geometry.dispose();
		this.leftArm.geometry.dispose();
		this.rightArm.geometry.dispose();
		this.leftLeg.geometry.dispose();
		this.rightLeg.geometry.dispose();

		// Dispose materials
		if (Array.isArray(this.head.material)) {
			this.head.material.forEach((mat) => mat.dispose());
		}
		if (this.torso.material instanceof THREE.Material) {
			this.torso.material.dispose();
		}
		if (this.leftArm.material instanceof THREE.Material) {
			this.leftArm.material.dispose();
		}
		if (this.rightArm.material instanceof THREE.Material) {
			this.rightArm.material.dispose();
		}
		if (this.leftLeg.material instanceof THREE.Material) {
			this.leftLeg.material.dispose();
		}
		if (this.rightLeg.material instanceof THREE.Material) {
			this.rightLeg.material.dispose();
		}

		// Dispose emotion sprite
		if (this.emoteSprite.material instanceof THREE.Material) {
			this.emoteSprite.material.dispose();
		}
		if (this.emoteTexture) {
			this.emoteTexture.dispose();
		}
	}
}
