/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

export interface SlopePhysicsConfig {
	maxWalkableSlope: number; // Maximum slope angle in degrees that can be walked
	slideThresholdSlope: number; // Slope angle where sliding begins (degrees)
	slideAcceleration: number; // Acceleration when sliding down
	maxSlideSpeed: number; // Maximum sliding speed
	slideFriction: number; // Friction to slow down sliding
	slopeSampleDistance: number; // Distance for slope calculation
	uphillSpeedFactor: number; // Speed multiplier when going uphill (0-1)
	downhillSpeedFactor: number; // Speed multiplier when going downhill (>1)
}

const DEFAULT_CONFIG: SlopePhysicsConfig = {
	maxWalkableSlope: 45, // 45 degrees max
	slideThresholdSlope: 35, // Start sliding at 35 degrees
	slideAcceleration: 8.0,
	maxSlideSpeed: 10.0,
	slideFriction: 2.0,
	slopeSampleDistance: 0.5,
	uphillSpeedFactor: 0.6, // 60% speed uphill
	downhillSpeedFactor: 1.3, // 130% speed downhill
};

export interface TerrainSampler {
	getHeightAt(x: number, z: number): number;
	isWalkableAt(x: number, z: number): boolean;
}

export interface SlopeInfo {
	angle: number; // Slope angle in degrees
	normal: THREE.Vector3; // Surface normal
	gradient: THREE.Vector3; // Direction of steepest descent
	isWalkable: boolean; // Can walk on this slope
	isSliding: boolean; // Should slide on this slope
}

/**
 * Slope physics system for Noctown.
 * Handles movement on slopes, sliding, and terrain navigation.
 */
export class SlopePhysicsSystem {
	private config: SlopePhysicsConfig;
	private terrainSampler: TerrainSampler | null = null;
	private slideVelocity: THREE.Vector3 = new THREE.Vector3();
	private isSliding: boolean = false;

	constructor(config: Partial<SlopePhysicsConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Set the terrain sampler for height queries.
	 */
	public setTerrainSampler(sampler: TerrainSampler): void {
		this.terrainSampler = sampler;
	}

	/**
	 * Calculate slope information at a position.
	 */
	public getSlopeInfo(position: THREE.Vector3): SlopeInfo {
		if (!this.terrainSampler) {
			return {
				angle: 0,
				normal: new THREE.Vector3(0, 1, 0),
				gradient: new THREE.Vector3(0, 0, 0),
				isWalkable: true,
				isSliding: false,
			};
		}

		const { slopeSampleDistance } = this.config;
		const height = this.terrainSampler.getHeightAt(position.x, position.z);

		// Sample heights in cardinal directions
		const heightN = this.terrainSampler.getHeightAt(position.x, position.z - slopeSampleDistance);
		const heightS = this.terrainSampler.getHeightAt(position.x, position.z + slopeSampleDistance);
		const heightE = this.terrainSampler.getHeightAt(position.x + slopeSampleDistance, position.z);
		const heightW = this.terrainSampler.getHeightAt(position.x - slopeSampleDistance, position.z);

		// Calculate gradient (direction of steepest descent)
		const gradX = (heightE - heightW) / (2 * slopeSampleDistance);
		const gradZ = (heightS - heightN) / (2 * slopeSampleDistance);

		// Calculate surface normal using cross product
		const tangentX = new THREE.Vector3(slopeSampleDistance * 2, heightE - heightW, 0);
		const tangentZ = new THREE.Vector3(0, heightS - heightN, slopeSampleDistance * 2);
		const normal = new THREE.Vector3().crossVectors(tangentZ, tangentX).normalize();

		// Ensure normal points upward
		if (normal.y < 0) {
			normal.multiplyScalar(-1);
		}

		// Calculate slope angle from normal
		const angle = THREE.MathUtils.radToDeg(Math.acos(normal.y));

		// Gradient vector (pointing downhill)
		const gradient = new THREE.Vector3(-gradX, 0, -gradZ);
		const gradientLength = gradient.length();
		if (gradientLength > 0.001) {
			gradient.divideScalar(gradientLength);
		}

		const isWalkable = angle <= this.config.maxWalkableSlope;
		const isSliding = angle >= this.config.slideThresholdSlope;

		return {
			angle,
			normal,
			gradient,
			isWalkable,
			isSliding,
		};
	}

	/**
	 * Apply slope effects to movement velocity.
	 */
	public applySlope(
		position: THREE.Vector3,
		velocity: THREE.Vector3,
		deltaTime: number,
	): THREE.Vector3 {
		const slopeInfo = this.getSlopeInfo(position);
		const resultVelocity = velocity.clone();

		// Check if movement is uphill or downhill
		const moveDir = velocity.clone().normalize();
		const dotWithGradient = moveDir.dot(slopeInfo.gradient);

		if (velocity.lengthSq() > 0.001) {
			// Apply speed modifiers based on slope direction
			if (dotWithGradient > 0.3) {
				// Moving downhill - speed up
				const speedMod = THREE.MathUtils.lerp(
					1.0,
					this.config.downhillSpeedFactor,
					Math.min(1, slopeInfo.angle / 30),
				);
				resultVelocity.multiplyScalar(speedMod);
			} else if (dotWithGradient < -0.3) {
				// Moving uphill - slow down
				const speedMod = THREE.MathUtils.lerp(
					1.0,
					this.config.uphillSpeedFactor,
					Math.min(1, slopeInfo.angle / 30),
				);
				resultVelocity.multiplyScalar(speedMod);
			}
		}

		// Handle sliding
		if (slopeInfo.isSliding && !slopeInfo.isWalkable) {
			this.isSliding = true;

			// Accelerate in downhill direction
			const slideAccel = slopeInfo.gradient.clone().multiplyScalar(
				this.config.slideAcceleration * deltaTime,
			);
			this.slideVelocity.add(slideAccel);

			// Apply friction
			const friction = this.slideVelocity.clone().multiplyScalar(
				-this.config.slideFriction * deltaTime,
			);
			this.slideVelocity.add(friction);

			// Clamp slide speed
			if (this.slideVelocity.length() > this.config.maxSlideSpeed) {
				this.slideVelocity.normalize().multiplyScalar(this.config.maxSlideSpeed);
			}

			// Add slide velocity to result
			resultVelocity.add(this.slideVelocity);
		} else {
			// Not on a sliding slope - gradually stop sliding
			this.isSliding = false;
			this.slideVelocity.multiplyScalar(1 - deltaTime * 5);
			if (this.slideVelocity.length() < 0.1) {
				this.slideVelocity.set(0, 0, 0);
			}
		}

		return resultVelocity;
	}

	/**
	 * Project movement onto the terrain surface.
	 * Keeps the player on the ground while moving on slopes.
	 */
	public projectMovementOnTerrain(
		currentPosition: THREE.Vector3,
		targetPosition: THREE.Vector3,
	): THREE.Vector3 {
		if (!this.terrainSampler) {
			return targetPosition.clone();
		}

		// Get terrain height at target position
		const terrainHeight = this.terrainSampler.getHeightAt(targetPosition.x, targetPosition.z);

		// Return position on terrain
		return new THREE.Vector3(
			targetPosition.x,
			terrainHeight,
			targetPosition.z,
		);
	}

	/**
	 * Check if a position is walkable (not too steep and valid terrain).
	 */
	public isPositionWalkable(position: THREE.Vector3): boolean {
		if (!this.terrainSampler) {
			return true;
		}

		const isTerrainWalkable = this.terrainSampler.isWalkableAt(position.x, position.z);
		const slopeInfo = this.getSlopeInfo(position);

		return isTerrainWalkable && slopeInfo.isWalkable;
	}

	/**
	 * Find the nearest walkable position from a given position.
	 * Useful for placing players after they finish sliding.
	 */
	public findNearestWalkable(position: THREE.Vector3, maxDistance: number = 5): THREE.Vector3 | null {
		if (this.isPositionWalkable(position)) {
			return position.clone();
		}

		// Search in expanding circles
		const searchAngles = 8;
		for (let dist = 0.5; dist <= maxDistance; dist += 0.5) {
			for (let i = 0; i < searchAngles; i++) {
				const angle = (i / searchAngles) * Math.PI * 2;
				const testPos = new THREE.Vector3(
					position.x + Math.cos(angle) * dist,
					0,
					position.z + Math.sin(angle) * dist,
				);

				if (this.terrainSampler) {
					testPos.y = this.terrainSampler.getHeightAt(testPos.x, testPos.z);
				}

				if (this.isPositionWalkable(testPos)) {
					return testPos;
				}
			}
		}

		return null;
	}

	/**
	 * Check if currently sliding.
	 */
	public getIsSliding(): boolean {
		return this.isSliding;
	}

	/**
	 * Get current slide velocity.
	 */
	public getSlideVelocity(): THREE.Vector3 {
		return this.slideVelocity.clone();
	}

	/**
	 * Reset sliding state.
	 */
	public resetSliding(): void {
		this.isSliding = false;
		this.slideVelocity.set(0, 0, 0);
	}

	/**
	 * Calculate camera tilt based on slope for visual feedback.
	 */
	public getCameraTilt(position: THREE.Vector3): { pitch: number; roll: number } {
		const slopeInfo = this.getSlopeInfo(position);

		// Calculate tilt based on slope normal
		const pitch = Math.atan2(slopeInfo.normal.z, slopeInfo.normal.y) * 0.3;
		const roll = Math.atan2(slopeInfo.normal.x, slopeInfo.normal.y) * 0.3;

		return { pitch, roll };
	}

	/**
	 * Get visual slope indicator direction for UI.
	 */
	public getSlopeIndicator(position: THREE.Vector3): {
		direction: THREE.Vector2;
		severity: number; // 0 = flat, 1 = maximum slope
	} {
		const slopeInfo = this.getSlopeInfo(position);

		const direction = new THREE.Vector2(
			slopeInfo.gradient.x,
			slopeInfo.gradient.z,
		);

		const severity = Math.min(1, slopeInfo.angle / this.config.maxWalkableSlope);

		return { direction, severity };
	}
}
