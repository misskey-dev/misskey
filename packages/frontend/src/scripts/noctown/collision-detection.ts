/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

export interface BoundingBox {
	min: THREE.Vector3;
	max: THREE.Vector3;
}

export interface CollisionResult {
	collided: boolean;
	normal: THREE.Vector3;
	penetration: number;
	collidedWith: Collider | null;
}

export interface Collider {
	id: string;
	type: 'box' | 'sphere' | 'cylinder';
	position: THREE.Vector3;
	size: THREE.Vector3; // For box: half extents, for sphere: radius in x, for cylinder: radius in x, height in y
	isTrigger: boolean;
	isStatic: boolean;
	layer: CollisionLayer;
	userData?: unknown;
}

export enum CollisionLayer {
	Default = 1 << 0,
	Player = 1 << 1,
	Environment = 1 << 2,
	Item = 1 << 3,
	NPC = 1 << 4,
	Building = 1 << 5,
	Water = 1 << 6,
	Trigger = 1 << 7,
}

// Layer collision matrix
const DEFAULT_COLLISION_MATRIX: Map<CollisionLayer, CollisionLayer[]> = new Map([
	[CollisionLayer.Player, [CollisionLayer.Environment, CollisionLayer.Building, CollisionLayer.Water, CollisionLayer.Trigger]],
	[CollisionLayer.NPC, [CollisionLayer.Environment, CollisionLayer.Building]],
	[CollisionLayer.Item, [CollisionLayer.Environment]],
]);

export class CollisionDetection {
	private colliders: Map<string, Collider> = new Map();
	private collisionMatrix: Map<CollisionLayer, CollisionLayer[]>;
	private spatialHash: Map<string, Set<string>> = new Map();
	private cellSize = 10;

	constructor(collisionMatrix?: Map<CollisionLayer, CollisionLayer[]>) {
		this.collisionMatrix = collisionMatrix ?? DEFAULT_COLLISION_MATRIX;
	}

	// Spatial hashing
	private getCellKey(x: number, z: number): string {
		const cellX = Math.floor(x / this.cellSize);
		const cellZ = Math.floor(z / this.cellSize);
		return `${cellX},${cellZ}`;
	}

	private getCellsForCollider(collider: Collider): string[] {
		const cells: string[] = [];
		const minX = Math.floor((collider.position.x - collider.size.x) / this.cellSize);
		const maxX = Math.floor((collider.position.x + collider.size.x) / this.cellSize);
		const minZ = Math.floor((collider.position.z - collider.size.z) / this.cellSize);
		const maxZ = Math.floor((collider.position.z + collider.size.z) / this.cellSize);

		for (let x = minX; x <= maxX; x++) {
			for (let z = minZ; z <= maxZ; z++) {
				cells.push(`${x},${z}`);
			}
		}
		return cells;
	}

	private addToSpatialHash(collider: Collider): void {
		const cells = this.getCellsForCollider(collider);
		for (const cell of cells) {
			if (!this.spatialHash.has(cell)) {
				this.spatialHash.set(cell, new Set());
			}
			this.spatialHash.get(cell)!.add(collider.id);
		}
	}

	private removeFromSpatialHash(collider: Collider): void {
		const cells = this.getCellsForCollider(collider);
		for (const cell of cells) {
			const set = this.spatialHash.get(cell);
			if (set) {
				set.delete(collider.id);
				if (set.size === 0) {
					this.spatialHash.delete(cell);
				}
			}
		}
	}

	// Collider management
	public addCollider(collider: Collider): void {
		this.colliders.set(collider.id, collider);
		this.addToSpatialHash(collider);
	}

	public removeCollider(id: string): void {
		const collider = this.colliders.get(id);
		if (collider) {
			this.removeFromSpatialHash(collider);
			this.colliders.delete(id);
		}
	}

	public updateColliderPosition(id: string, position: THREE.Vector3): void {
		const collider = this.colliders.get(id);
		if (collider) {
			this.removeFromSpatialHash(collider);
			collider.position.copy(position);
			this.addToSpatialHash(collider);
		}
	}

	public getCollider(id: string): Collider | undefined {
		return this.colliders.get(id);
	}

	// Collision checks
	public checkCollision(
		position: THREE.Vector3,
		size: THREE.Vector3,
		layer: CollisionLayer,
		excludeId?: string,
	): CollisionResult {
		const result: CollisionResult = {
			collided: false,
			normal: new THREE.Vector3(),
			penetration: 0,
			collidedWith: null,
		};

		const allowedLayers = this.collisionMatrix.get(layer) ?? [];
		if (allowedLayers.length === 0) return result;

		// Get nearby colliders using spatial hash
		const cellKey = this.getCellKey(position.x, position.z);
		const nearbyCells = [
			cellKey,
			`${parseInt(cellKey.split(',')[0]) - 1},${cellKey.split(',')[1]}`,
			`${parseInt(cellKey.split(',')[0]) + 1},${cellKey.split(',')[1]}`,
			`${cellKey.split(',')[0]},${parseInt(cellKey.split(',')[1]) - 1}`,
			`${cellKey.split(',')[0]},${parseInt(cellKey.split(',')[1]) + 1}`,
		];

		const checkedIds = new Set<string>();

		for (const cell of nearbyCells) {
			const colliderIds = this.spatialHash.get(cell);
			if (!colliderIds) continue;

			for (const colliderId of colliderIds) {
				if (checkedIds.has(colliderId)) continue;
				if (colliderId === excludeId) continue;
				checkedIds.add(colliderId);

				const collider = this.colliders.get(colliderId);
				if (!collider) continue;
				if (!allowedLayers.includes(collider.layer)) continue;

				const collision = this.testCollision(position, size, collider);
				if (collision.collided && collision.penetration > result.penetration) {
					result.collided = true;
					result.normal.copy(collision.normal);
					result.penetration = collision.penetration;
					result.collidedWith = collider;
				}
			}
		}

		return result;
	}

	private testCollision(
		position: THREE.Vector3,
		size: THREE.Vector3,
		collider: Collider,
	): CollisionResult {
		switch (collider.type) {
			case 'box':
				return this.boxBoxCollision(position, size, collider.position, collider.size);
			case 'sphere':
				return this.boxSphereCollision(position, size, collider.position, collider.size.x);
			case 'cylinder':
				return this.boxCylinderCollision(position, size, collider.position, collider.size.x, collider.size.y);
			default:
				return { collided: false, normal: new THREE.Vector3(), penetration: 0, collidedWith: null };
		}
	}

	private boxBoxCollision(
		posA: THREE.Vector3,
		sizeA: THREE.Vector3,
		posB: THREE.Vector3,
		sizeB: THREE.Vector3,
	): CollisionResult {
		const result: CollisionResult = {
			collided: false,
			normal: new THREE.Vector3(),
			penetration: 0,
			collidedWith: null,
		};

		const dx = posA.x - posB.x;
		const dy = posA.y - posB.y;
		const dz = posA.z - posB.z;

		const overlapX = (sizeA.x + sizeB.x) - Math.abs(dx);
		const overlapY = (sizeA.y + sizeB.y) - Math.abs(dy);
		const overlapZ = (sizeA.z + sizeB.z) - Math.abs(dz);

		if (overlapX > 0 && overlapY > 0 && overlapZ > 0) {
			result.collided = true;

			// Find minimum penetration axis
			if (overlapX < overlapY && overlapX < overlapZ) {
				result.penetration = overlapX;
				result.normal.set(dx > 0 ? 1 : -1, 0, 0);
			} else if (overlapY < overlapZ) {
				result.penetration = overlapY;
				result.normal.set(0, dy > 0 ? 1 : -1, 0);
			} else {
				result.penetration = overlapZ;
				result.normal.set(0, 0, dz > 0 ? 1 : -1);
			}
		}

		return result;
	}

	private boxSphereCollision(
		boxPos: THREE.Vector3,
		boxSize: THREE.Vector3,
		spherePos: THREE.Vector3,
		sphereRadius: number,
	): CollisionResult {
		const result: CollisionResult = {
			collided: false,
			normal: new THREE.Vector3(),
			penetration: 0,
			collidedWith: null,
		};

		// Find closest point on box to sphere center
		const closest = new THREE.Vector3(
			Math.max(boxPos.x - boxSize.x, Math.min(spherePos.x, boxPos.x + boxSize.x)),
			Math.max(boxPos.y - boxSize.y, Math.min(spherePos.y, boxPos.y + boxSize.y)),
			Math.max(boxPos.z - boxSize.z, Math.min(spherePos.z, boxPos.z + boxSize.z)),
		);

		const distance = closest.distanceTo(spherePos);

		if (distance < sphereRadius) {
			result.collided = true;
			result.penetration = sphereRadius - distance;
			result.normal.subVectors(boxPos, spherePos).normalize();
		}

		return result;
	}

	private boxCylinderCollision(
		boxPos: THREE.Vector3,
		boxSize: THREE.Vector3,
		cylPos: THREE.Vector3,
		cylRadius: number,
		cylHeight: number,
	): CollisionResult {
		// Simplified: treat as 2D circle + height check
		const result: CollisionResult = {
			collided: false,
			normal: new THREE.Vector3(),
			penetration: 0,
			collidedWith: null,
		};

		// Height check
		const boxMinY = boxPos.y - boxSize.y;
		const boxMaxY = boxPos.y + boxSize.y;
		const cylMinY = cylPos.y;
		const cylMaxY = cylPos.y + cylHeight;

		if (boxMaxY < cylMinY || boxMinY > cylMaxY) {
			return result;
		}

		// 2D circle-box collision (XZ plane)
		const closestX = Math.max(boxPos.x - boxSize.x, Math.min(cylPos.x, boxPos.x + boxSize.x));
		const closestZ = Math.max(boxPos.z - boxSize.z, Math.min(cylPos.z, boxPos.z + boxSize.z));

		const dx = cylPos.x - closestX;
		const dz = cylPos.z - closestZ;
		const distance = Math.sqrt(dx * dx + dz * dz);

		if (distance < cylRadius) {
			result.collided = true;
			result.penetration = cylRadius - distance;
			if (distance > 0) {
				result.normal.set(-dx / distance, 0, -dz / distance);
			} else {
				result.normal.set(1, 0, 0);
			}
		}

		return result;
	}

	// Raycast
	public raycast(
		origin: THREE.Vector3,
		direction: THREE.Vector3,
		maxDistance: number,
		layers: CollisionLayer[],
	): { hit: boolean; point: THREE.Vector3; distance: number; collider: Collider | null } {
		let closestHit = {
			hit: false,
			point: new THREE.Vector3(),
			distance: maxDistance,
			collider: null as Collider | null,
		};

		const normalizedDir = direction.clone().normalize();

		for (const collider of this.colliders.values()) {
			if (!layers.includes(collider.layer)) continue;

			const hit = this.raycastCollider(origin, normalizedDir, maxDistance, collider);
			if (hit.hit && hit.distance < closestHit.distance) {
				closestHit = { ...hit, collider };
			}
		}

		return closestHit;
	}

	private raycastCollider(
		origin: THREE.Vector3,
		direction: THREE.Vector3,
		maxDistance: number,
		collider: Collider,
	): { hit: boolean; point: THREE.Vector3; distance: number } {
		// Simple AABB raycast
		const invDir = new THREE.Vector3(
			direction.x !== 0 ? 1 / direction.x : Infinity,
			direction.y !== 0 ? 1 / direction.y : Infinity,
			direction.z !== 0 ? 1 / direction.z : Infinity,
		);

		const min = collider.position.clone().sub(collider.size);
		const max = collider.position.clone().add(collider.size);

		const t1 = (min.x - origin.x) * invDir.x;
		const t2 = (max.x - origin.x) * invDir.x;
		const t3 = (min.y - origin.y) * invDir.y;
		const t4 = (max.y - origin.y) * invDir.y;
		const t5 = (min.z - origin.z) * invDir.z;
		const t6 = (max.z - origin.z) * invDir.z;

		const tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
		const tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

		if (tmax < 0 || tmin > tmax || tmin > maxDistance) {
			return { hit: false, point: new THREE.Vector3(), distance: Infinity };
		}

		const t = tmin >= 0 ? tmin : tmax;
		return {
			hit: true,
			point: origin.clone().add(direction.clone().multiplyScalar(t)),
			distance: t,
		};
	}

	// Utility
	public clear(): void {
		this.colliders.clear();
		this.spatialHash.clear();
	}

	public getColliderCount(): number {
		return this.colliders.size;
	}
}

// Singleton
let instance: CollisionDetection | null = null;

export function getCollisionDetection(): CollisionDetection {
	if (!instance) {
		instance = new CollisionDetection();
	}
	return instance;
}

export function disposeCollisionDetection(): void {
	if (instance) {
		instance.clear();
		instance = null;
	}
}
