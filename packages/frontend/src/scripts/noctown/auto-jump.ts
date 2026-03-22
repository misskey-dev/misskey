/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

export interface AutoJumpConfig {
	maxJumpHeight: number; // Maximum height difference that can be auto-jumped
	minJumpDistance: number; // Minimum horizontal distance before considering jump
	jumpDuration: number; // Duration of jump animation in seconds
	jumpCurveHeight: number; // Peak height of jump arc
	detectionDistance: number; // Forward detection distance
	detectionSamples: number; // Number of samples for terrain detection
}

const DEFAULT_CONFIG: AutoJumpConfig = {
	maxJumpHeight: 2.0, // Can auto-jump up to 2 units
	minJumpDistance: 0.3, // Minimum 0.3 units before considering
	jumpDuration: 0.4, // 400ms jump
	jumpCurveHeight: 0.8, // Extra height at peak of jump
	detectionDistance: 1.5, // Look 1.5 units ahead
	detectionSamples: 5, // Sample terrain at 5 points
};

interface JumpState {
	isJumping: boolean;
	startPosition: THREE.Vector3;
	targetPosition: THREE.Vector3;
	startHeight: number;
	targetHeight: number;
	progress: number; // 0 to 1
}

export interface TerrainSampler {
	getHeightAt(x: number, z: number): number;
	isWalkableAt(x: number, z: number): boolean;
}

/**
 * Auto-jump system for Noctown.
 * Automatically jumps when the player approaches small elevation changes.
 */
export class AutoJumpSystem {
	private config: AutoJumpConfig;
	private jumpState: JumpState;
	private terrainSampler: TerrainSampler | null = null;

	constructor(config: Partial<AutoJumpConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.jumpState = {
			isJumping: false,
			startPosition: new THREE.Vector3(),
			targetPosition: new THREE.Vector3(),
			startHeight: 0,
			targetHeight: 0,
			progress: 0,
		};
	}

	/**
	 * Set the terrain sampler for height queries.
	 */
	public setTerrainSampler(sampler: TerrainSampler): void {
		this.terrainSampler = sampler;
	}

	/**
	 * Check if auto-jump should be triggered and initiate if needed.
	 * Call this every frame when the player is moving.
	 */
	public checkAndInitiateJump(
		currentPosition: THREE.Vector3,
		moveDirection: THREE.Vector3,
		currentHeight: number,
	): boolean {
		// Skip if already jumping or no terrain sampler
		if (this.jumpState.isJumping || !this.terrainSampler) {
			return false;
		}

		// Skip if not moving
		if (moveDirection.lengthSq() < 0.001) {
			return false;
		}

		const normalizedDir = moveDirection.clone().normalize();

		// Sample terrain ahead
		const terrainInfo = this.detectTerrainAhead(currentPosition, normalizedDir, currentHeight);

		if (!terrainInfo.needsJump) {
			return false;
		}

		// Initiate jump
		this.jumpState = {
			isJumping: true,
			startPosition: currentPosition.clone(),
			targetPosition: terrainInfo.targetPosition,
			startHeight: currentHeight,
			targetHeight: terrainInfo.targetHeight,
			progress: 0,
		};

		return true;
	}

	/**
	 * Detect terrain ahead and determine if a jump is needed.
	 */
	private detectTerrainAhead(
		position: THREE.Vector3,
		direction: THREE.Vector3,
		currentHeight: number,
	): {
		needsJump: boolean;
		targetPosition: THREE.Vector3;
		targetHeight: number;
	} {
		if (!this.terrainSampler) {
			return {
				needsJump: false,
				targetPosition: position.clone(),
				targetHeight: currentHeight,
			};
		}

		const { detectionDistance, detectionSamples, maxJumpHeight, minJumpDistance } = this.config;

		// Sample terrain at multiple points ahead
		let foundObstacle = false;
		let obstacleDistance = 0;
		let obstacleHeight = currentHeight;
		let highestPoint = currentHeight;
		let highestPointDistance = 0;

		for (let i = 1; i <= detectionSamples; i++) {
			const sampleDist = (i / detectionSamples) * detectionDistance;
			const sampleX = position.x + direction.x * sampleDist;
			const sampleZ = position.z + direction.z * sampleDist;

			const terrainHeight = this.terrainSampler.getHeightAt(sampleX, sampleZ);
			const isWalkable = this.terrainSampler.isWalkableAt(sampleX, sampleZ);

			// Check for upward obstacle
			const heightDiff = terrainHeight - currentHeight;

			if (heightDiff > 0.2 && heightDiff <= maxJumpHeight && isWalkable) {
				if (!foundObstacle) {
					foundObstacle = true;
					obstacleDistance = sampleDist;
					obstacleHeight = terrainHeight;
				}
			}

			// Track highest walkable point for landing
			if (isWalkable && terrainHeight > highestPoint) {
				highestPoint = terrainHeight;
				highestPointDistance = sampleDist;
			}
		}

		// Determine if jump is needed
		if (!foundObstacle) {
			return {
				needsJump: false,
				targetPosition: position.clone(),
				targetHeight: currentHeight,
			};
		}

		// Jump is needed - calculate landing position
		const landingDistance = Math.max(obstacleDistance + 0.5, highestPointDistance);
		const targetPosition = new THREE.Vector3(
			position.x + direction.x * landingDistance,
			0, // Will be set from terrain
			position.z + direction.z * landingDistance,
		);

		const targetHeight = this.terrainSampler.getHeightAt(targetPosition.x, targetPosition.z);
		targetPosition.y = targetHeight;

		return {
			needsJump: true,
			targetPosition,
			targetHeight,
		};
	}

	/**
	 * Update the jump animation.
	 * Returns the current position during jump, or null if not jumping.
	 */
	public update(deltaTime: number): THREE.Vector3 | null {
		if (!this.jumpState.isJumping) {
			return null;
		}

		// Update progress
		this.jumpState.progress += deltaTime / this.config.jumpDuration;

		if (this.jumpState.progress >= 1) {
			// Jump complete
			this.jumpState.isJumping = false;
			this.jumpState.progress = 1;
			return this.jumpState.targetPosition.clone();
		}

		// Calculate current position using parabolic arc
		const t = this.jumpState.progress;
		const { startPosition, targetPosition, startHeight, targetHeight } = this.jumpState;

		// Horizontal interpolation
		const currentX = THREE.MathUtils.lerp(startPosition.x, targetPosition.x, t);
		const currentZ = THREE.MathUtils.lerp(startPosition.z, targetPosition.z, t);

		// Vertical position with parabolic arc
		// Using quadratic bezier: start -> peak -> end
		const linearY = THREE.MathUtils.lerp(startHeight, targetHeight, t);
		const peakHeight = Math.max(startHeight, targetHeight) + this.config.jumpCurveHeight;

		// Parabolic arc: 4 * t * (1 - t) gives a smooth curve peaking at t=0.5
		const arcFactor = 4 * t * (1 - t);
		const currentY = linearY + (peakHeight - linearY) * arcFactor;

		return new THREE.Vector3(currentX, currentY, currentZ);
	}

	/**
	 * Check if currently in a jump animation.
	 */
	public isJumping(): boolean {
		return this.jumpState.isJumping;
	}

	/**
	 * Cancel the current jump (for emergency use).
	 */
	public cancelJump(): void {
		this.jumpState.isJumping = false;
		this.jumpState.progress = 0;
	}

	/**
	 * Get jump progress (0 to 1).
	 */
	public getJumpProgress(): number {
		return this.jumpState.isJumping ? this.jumpState.progress : 0;
	}

	/**
	 * Get the target position of the current jump.
	 */
	public getJumpTarget(): THREE.Vector3 | null {
		return this.jumpState.isJumping ? this.jumpState.targetPosition.clone() : null;
	}

	/**
	 * Force initiate a jump to a specific position.
	 */
	public forceJump(
		currentPosition: THREE.Vector3,
		targetPosition: THREE.Vector3,
		currentHeight: number,
		targetHeight: number,
	): void {
		this.jumpState = {
			isJumping: true,
			startPosition: currentPosition.clone(),
			targetPosition: targetPosition.clone(),
			startHeight: currentHeight,
			targetHeight,
			progress: 0,
		};
	}
}
