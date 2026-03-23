/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Environment Entity helpers - trees, rocks, etc.
 * Based on character-demo.html implementation
 */

import * as THREE from 'three';

/**
 * Add a tree entity to the scene or group
 * 仕様: sceneまたはchunkGroupに木を追加する。chunkGroupに追加するとリロード時に正しく削除される
 * @param parent Three.js scene or group to add the tree to
 * @param x X position
 * @param z Z position
 */
export function addTree(parent: THREE.Object3D, x: number, z: number): void {
	// Trunk (CylinderGeometry)
	const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8);
	const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 }); // Brown
	const trunk = new THREE.Mesh(trunkGeo, trunkMat);
	trunk.position.set(x, 0.75, z);
	trunk.castShadow = true;
	parent.add(trunk);

	// Leaves (ConeGeometry)
	const leavesGeo = new THREE.ConeGeometry(1, 2, 8);
	const leavesMat = new THREE.MeshStandardMaterial({ color: 0x228b22 }); // Forest green
	const leaves = new THREE.Mesh(leavesGeo, leavesMat);
	leaves.position.set(x, 2.5, z);
	leaves.castShadow = true;
	parent.add(leaves);
}

/**
 * Add a rock entity to the scene or group
 * 仕様: sceneまたはchunkGroupに岩を追加する。chunkGroupに追加するとリロード時に正しく削除される
 * @param parent Three.js scene or group to add the rock to
 * @param x X position
 * @param z Z position
 * @param scale Scale factor (default: 1)
 */
export function addRock(parent: THREE.Object3D, x: number, z: number, scale: number = 1): void {
	const rockGeo = new THREE.DodecahedronGeometry(0.5 * scale, 0);
	const rockMat = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.9 }); // Gray
	const rock = new THREE.Mesh(rockGeo, rockMat);
	rock.position.set(x, 0.25 * scale, z);
	rock.rotation.set(Math.random(), Math.random(), Math.random());
	rock.castShadow = true;
	parent.add(rock);
}

/**
 * Add random trees and rocks to a chunk
 * 仕様: sceneまたはchunkGroupにランダムな木と岩を追加する。chunkGroupに追加するとリロード時に正しく削除される
 * @param parent Three.js scene or group to add entities to
 * @param chunkX Chunk X coordinate
 * @param chunkZ Chunk Z coordinate
 * @param chunkSize Size of chunk (default: 16)
 */
export function addRandomEnvironmentEntities(
	parent: THREE.Object3D,
	chunkX: number,
	chunkZ: number,
	chunkSize: number = 16,
): void {
	const baseX = chunkX * chunkSize;
	const baseZ = chunkZ * chunkSize;

	// Random seed based on chunk coordinates for consistent placement
	const seed = chunkX * 73856093 ^ chunkZ * 19349663;
	const random = (offset: number) => {
		const x = Math.sin(seed + offset) * 10000;
		return x - Math.floor(x);
	};

	// Add 1-3 trees per chunk
	const treeCount = Math.floor(random(0) * 3) + 1;
	for (let i = 0; i < treeCount; i++) {
		const x = baseX + random(i * 2) * chunkSize;
		const z = baseZ + random(i * 2 + 1) * chunkSize;
		addTree(parent, x, z);
	}

	// Add 1-4 rocks per chunk
	const rockCount = Math.floor(random(100) * 4) + 1;
	for (let i = 0; i < rockCount; i++) {
		const x = baseX + random(i * 3 + 100) * chunkSize;
		const z = baseZ + random(i * 3 + 101) * chunkSize;
		const scale = 0.5 + random(i * 3 + 102) * 1.0; // 0.5-1.5
		addRock(parent, x, z, scale);
	}
}
