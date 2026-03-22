/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { NoctownPlacedItemsRepository, NoctownPlayersRepository } from '@/models/_.js';
import { Between } from 'typeorm';

// Direction vectors for fence connections
const DIRECTIONS = [
	{ dx: 1, dz: 0, name: 'east' as const },
	{ dx: -1, dz: 0, name: 'west' as const },
	{ dx: 0, dz: 1, name: 'south' as const },
	{ dx: 0, dz: -1, name: 'north' as const },
];

// Fence segment length
const FENCE_LENGTH = 2;

export interface FenceEnclosure {
	id: string;
	fenceIds: string[];
	boundingBox: {
		minX: number;
		maxX: number;
		minZ: number;
		maxZ: number;
	};
	area: number;
	isValid: boolean;
	hasGate: boolean;
}

export interface EnclosureContents {
	players: string[];
	animals: string[];
	crops: string[];
}

/**
 * Fence service for Noctown.
 * Handles fence placement validation and enclosure detection.
 */
@Injectable()
export class FenceService {
	constructor(
		@Inject(DI.noctownPlacedItemsRepository)
		private placedItemsRepository: NoctownPlacedItemsRepository,

		@Inject(DI.noctownPlayersRepository)
		private playersRepository: NoctownPlayersRepository,
	) {}

	/**
	 * Get all fence items near a position
	 */
	public async getFencesNear(x: number, z: number, radius: number): Promise<Array<{
		id: string;
		positionX: number;
		positionZ: number;
		direction: string;
		hasGate: boolean;
	}>> {
		const placedItems = await this.placedItemsRepository.find({
			where: {
				positionX: Between(x - radius, x + radius),
				positionZ: Between(z - radius, z + radius),
			},
			relations: ['item'],
		});

		// Filter for fence items
		// Note: direction and hasGate are inferred from rotation and item name
		return placedItems
			.filter(item => item.item?.name === 'フェンス' || item.item?.name.includes('フェンス'))
			.map(item => ({
				id: item.id,
				positionX: item.positionX,
				positionZ: item.positionZ,
				direction: this.rotationToDirection(item.rotation),
				hasGate: item.item?.name.includes('ゲート') ?? false,
			}));
	}

	/**
	 * Detect enclosure starting from a fence piece
	 */
	public async detectEnclosure(startFenceId: string): Promise<FenceEnclosure | null> {
		const startFence = await this.placedItemsRepository.findOne({
			where: { id: startFenceId },
			relations: ['item'],
		});

		if (!startFence) {
			return null;
		}

		// Get all fences in the area to build a graph
		const fences = await this.getFencesNear(
			startFence.positionX,
			startFence.positionZ,
			50, // Search radius
		);

		if (fences.length < 4) {
			return null; // Need at least 4 fences to form an enclosure
		}

		// Build adjacency map for fence connections
		const adjacencyMap = this.buildFenceAdjacencyMap(fences);

		// Try to find a closed loop starting from the start fence
		const enclosedFenceIds = this.findClosedLoop(startFenceId, adjacencyMap, fences);

		if (!enclosedFenceIds || enclosedFenceIds.length < 4) {
			return null;
		}

		// Calculate bounding box
		const enclosedFences = fences.filter(f => enclosedFenceIds.includes(f.id));
		const boundingBox = this.calculateBoundingBox(enclosedFences);

		// Calculate area
		const area = (boundingBox.maxX - boundingBox.minX) * (boundingBox.maxZ - boundingBox.minZ);

		// Check for gates
		const hasGate = enclosedFences.some(f => f.hasGate);

		return {
			id: `enclosure_${startFenceId}`,
			fenceIds: enclosedFenceIds,
			boundingBox,
			area,
			isValid: true,
			hasGate,
		};
	}

	/**
	 * Build adjacency map for fence connections
	 */
	private buildFenceAdjacencyMap(fences: Array<{
		id: string;
		positionX: number;
		positionZ: number;
		direction: string;
	}>): Map<string, string[]> {
		const adjacencyMap = new Map<string, string[]>();
		const tolerance = 0.5; // Position tolerance for connections

		for (const fence of fences) {
			const neighbors: string[] = [];

			// Check each direction for potential connections
			for (const dir of DIRECTIONS) {
				const targetX = fence.positionX + dir.dx * FENCE_LENGTH;
				const targetZ = fence.positionZ + dir.dz * FENCE_LENGTH;

				// Find fence at target position
				const neighbor = fences.find(f =>
					f.id !== fence.id &&
					Math.abs(f.positionX - targetX) < tolerance &&
					Math.abs(f.positionZ - targetZ) < tolerance,
				);

				if (neighbor) {
					neighbors.push(neighbor.id);
				}
			}

			// Also check for corner connections (perpendicular fences)
			const cornerOffsets = [
				{ dx: FENCE_LENGTH / 2, dz: FENCE_LENGTH / 2 },
				{ dx: FENCE_LENGTH / 2, dz: -FENCE_LENGTH / 2 },
				{ dx: -FENCE_LENGTH / 2, dz: FENCE_LENGTH / 2 },
				{ dx: -FENCE_LENGTH / 2, dz: -FENCE_LENGTH / 2 },
			];

			for (const offset of cornerOffsets) {
				const cornerNeighbor = fences.find(f =>
					f.id !== fence.id &&
					Math.abs(f.positionX - (fence.positionX + offset.dx)) < tolerance &&
					Math.abs(f.positionZ - (fence.positionZ + offset.dz)) < tolerance,
				);

				if (cornerNeighbor && !neighbors.includes(cornerNeighbor.id)) {
					neighbors.push(cornerNeighbor.id);
				}
			}

			adjacencyMap.set(fence.id, neighbors);
		}

		return adjacencyMap;
	}

	/**
	 * Find a closed loop of fences using DFS
	 */
	private findClosedLoop(
		startId: string,
		adjacencyMap: Map<string, string[]>,
		_fences: Array<{ id: string }>,
	): string[] | null {
		const visited = new Set<string>();
		const path: string[] = [];

		const dfs = (currentId: string, parentId: string | null, depth: number): boolean => {
			if (depth > 100) return false; // Prevent infinite loops

			visited.add(currentId);
			path.push(currentId);

			const neighbors = adjacencyMap.get(currentId) ?? [];

			for (const neighborId of neighbors) {
				if (neighborId === startId && depth >= 3) {
					// Found a cycle back to start
					return true;
				}

				if (!visited.has(neighborId) && neighborId !== parentId) {
					if (dfs(neighborId, currentId, depth + 1)) {
						return true;
					}
				}
			}

			// Backtrack
			path.pop();
			return false;
		};

		if (dfs(startId, null, 0)) {
			return path;
		}

		return null;
	}

	/**
	 * Calculate bounding box for a set of fences
	 */
	private calculateBoundingBox(fences: Array<{
		positionX: number;
		positionZ: number;
	}>): { minX: number; maxX: number; minZ: number; maxZ: number } {
		const xs = fences.map(f => f.positionX);
		const zs = fences.map(f => f.positionZ);

		return {
			minX: Math.min(...xs) - FENCE_LENGTH / 2,
			maxX: Math.max(...xs) + FENCE_LENGTH / 2,
			minZ: Math.min(...zs) - FENCE_LENGTH / 2,
			maxZ: Math.max(...zs) + FENCE_LENGTH / 2,
		};
	}

	/**
	 * Check if a point is inside an enclosure
	 */
	public isPointInEnclosure(
		x: number,
		z: number,
		enclosure: FenceEnclosure,
	): boolean {
		return (
			x >= enclosure.boundingBox.minX &&
			x <= enclosure.boundingBox.maxX &&
			z >= enclosure.boundingBox.minZ &&
			z <= enclosure.boundingBox.maxZ
		);
	}

	/**
	 * Get contents of an enclosure (players, animals, etc.)
	 */
	public async getEnclosureContents(
		enclosure: FenceEnclosure,
	): Promise<EnclosureContents> {
		// Get players in enclosure
		const players = await this.playersRepository.find({
			where: {
				positionX: Between(enclosure.boundingBox.minX, enclosure.boundingBox.maxX),
				positionZ: Between(enclosure.boundingBox.minZ, enclosure.boundingBox.maxZ),
			},
		});

		// Get placed items (animals, crops) in enclosure
		const placedItems = await this.placedItemsRepository.find({
			where: {
				positionX: Between(enclosure.boundingBox.minX, enclosure.boundingBox.maxX),
				positionZ: Between(enclosure.boundingBox.minZ, enclosure.boundingBox.maxZ),
			},
			relations: ['item'],
		});

		const animals = placedItems
			.filter(item => item.item?.itemType === 'agent')
			.map(item => item.id);

		const crops = placedItems
			.filter(item => item.item?.itemType === 'seed' || item.item?.itemType === 'placeable')
			.map(item => item.id);

		return {
			players: players.map(p => p.id),
			animals,
			crops,
		};
	}

	/**
	 * Validate fence placement (check for collisions and connections)
	 */
	public async validateFencePlacement(
		x: number,
		z: number,
		direction: string,
	): Promise<{ valid: boolean; reason?: string }> {
		const tolerance = 0.3;

		// Check for existing fence at same position
		const existingFence = await this.placedItemsRepository.findOne({
			where: {
				positionX: Between(x - tolerance, x + tolerance),
				positionZ: Between(z - tolerance, z + tolerance),
			},
			relations: ['item'],
		});

		if (existingFence && existingFence.item?.name === 'フェンス') {
			return { valid: false, reason: 'Fence already exists at this position' };
		}

		// Check for nearby fences to connect to
		const nearbyFences = await this.getFencesNear(x, z, FENCE_LENGTH * 1.5);

		// Fence is valid even without connections (can be standalone)
		return { valid: true };
	}

	/**
	 * Convert rotation angle to direction string
	 */
	private rotationToDirection(rotation: number): string {
		// Normalize rotation to 0-360
		const normalized = ((rotation % 360) + 360) % 360;
		if (normalized < 45 || normalized >= 315) return 'north';
		if (normalized < 135) return 'east';
		if (normalized < 225) return 'south';
		return 'west';
	}

	/**
	 * Get all enclosures owned by a player
	 */
	public async getPlayerEnclosures(playerId: string): Promise<FenceEnclosure[]> {
		// Get all fences placed by this player
		const playerFences = await this.placedItemsRepository.find({
			where: { playerId },
			relations: ['item'],
		});

		const fencePlacements = playerFences.filter(
			item => item.item?.name === 'フェンス',
		);

		const enclosures: FenceEnclosure[] = [];
		const processedIds = new Set<string>();

		for (const fence of fencePlacements) {
			if (processedIds.has(fence.id)) continue;

			const enclosure = await this.detectEnclosure(fence.id);
			if (enclosure) {
				enclosures.push(enclosure);
				// Mark all fences in this enclosure as processed
				for (const id of enclosure.fenceIds) {
					processedIds.add(id);
				}
			}
		}

		return enclosures;
	}
}
