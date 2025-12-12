/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

export interface TapMoveConfig {
	moveSpeed: number;
	arrivalThreshold: number;
	maxPathLength: number;
	showPathIndicator: boolean;
}

const DEFAULT_CONFIG: TapMoveConfig = {
	moveSpeed: 0.15,
	arrivalThreshold: 0.5,
	maxPathLength: 50,
	showPathIndicator: true,
};

export interface TapMoveState {
	isMoving: boolean;
	targetPosition: THREE.Vector3 | null;
	currentPath: THREE.Vector3[];
	progress: number;
}

type MoveCallback = (x: number, y: number, z: number, rotation: number) => void;
type ArrivalCallback = () => void;

export class TapMovement {
	private camera: THREE.Camera;
	private scene: THREE.Scene;
	private groundPlane: THREE.Plane;
	private raycaster: THREE.Raycaster;
	private config: TapMoveConfig;

	private state: TapMoveState = {
		isMoving: false,
		targetPosition: null,
		currentPath: [],
		progress: 0,
	};

	// Visual indicators
	private targetMarker: THREE.Mesh | null = null;
	private pathLine: THREE.Line | null = null;

	// Callbacks
	private onMove: MoveCallback | null = null;
	private onArrival: ArrivalCallback | null = null;

	// Animation frame
	private animationId: number | null = null;
	private lastTime = 0;

	constructor(
		camera: THREE.Camera,
		scene: THREE.Scene,
		groundY: number = 0,
		config: Partial<TapMoveConfig> = {},
	) {
		this.camera = camera;
		this.scene = scene;
		this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -groundY);
		this.raycaster = new THREE.Raycaster();
		this.config = { ...DEFAULT_CONFIG, ...config };

		if (this.config.showPathIndicator) {
			this.createVisualIndicators();
		}
	}

	private createVisualIndicators(): void {
		// Target marker (circle on ground)
		const markerGeometry = new THREE.RingGeometry(0.3, 0.5, 32);
		const markerMaterial = new THREE.MeshBasicMaterial({
			color: 0x4ade80,
			transparent: true,
			opacity: 0.8,
			side: THREE.DoubleSide,
		});
		this.targetMarker = new THREE.Mesh(markerGeometry, markerMaterial);
		this.targetMarker.rotation.x = -Math.PI / 2;
		this.targetMarker.visible = false;
		this.scene.add(this.targetMarker);

		// Path line
		const lineGeometry = new THREE.BufferGeometry();
		const lineMaterial = new THREE.LineDashedMaterial({
			color: 0x4ade80,
			dashSize: 0.3,
			gapSize: 0.2,
			transparent: true,
			opacity: 0.5,
		});
		this.pathLine = new THREE.Line(lineGeometry, lineMaterial);
		this.pathLine.visible = false;
		this.scene.add(this.pathLine);
	}

	public setCallbacks(onMove: MoveCallback, onArrival: ArrivalCallback): void {
		this.onMove = onMove;
		this.onArrival = onArrival;
	}

	public handleTap(screenX: number, screenY: number, containerWidth: number, containerHeight: number): boolean {
		// Convert screen coordinates to normalized device coordinates
		const ndcX = (screenX / containerWidth) * 2 - 1;
		const ndcY = -(screenY / containerHeight) * 2 + 1;

		// Raycast from camera through tap point
		this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);

		// Find intersection with ground plane
		const intersection = new THREE.Vector3();
		const ray = this.raycaster.ray;

		if (ray.intersectPlane(this.groundPlane, intersection)) {
			this.setTarget(intersection);
			return true;
		}

		return false;
	}

	public setTarget(position: THREE.Vector3): void {
		this.state.targetPosition = position.clone();
		this.state.isMoving = true;
		this.state.progress = 0;

		// Update visual indicators
		if (this.targetMarker) {
			this.targetMarker.position.copy(position);
			this.targetMarker.position.y += 0.01; // Slightly above ground
			this.targetMarker.visible = true;
		}

		// Start animation loop if not running
		if (this.animationId === null) {
			this.lastTime = performance.now();
			this.animate();
		}
	}

	public cancelMovement(): void {
		this.state.isMoving = false;
		this.state.targetPosition = null;
		this.state.currentPath = [];

		if (this.targetMarker) {
			this.targetMarker.visible = false;
		}
		if (this.pathLine) {
			this.pathLine.visible = false;
		}

		if (this.animationId !== null) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
	}

	public update(currentPosition: THREE.Vector3): { x: number; z: number; rotation: number } | null {
		if (!this.state.isMoving || !this.state.targetPosition) {
			return null;
		}

		// Calculate direction to target
		const dx = this.state.targetPosition.x - currentPosition.x;
		const dz = this.state.targetPosition.z - currentPosition.z;
		const distance = Math.sqrt(dx * dx + dz * dz);

		// Check if arrived
		if (distance < this.config.arrivalThreshold) {
			this.arrive();
			return null;
		}

		// Normalize direction
		const normalizedX = dx / distance;
		const normalizedZ = dz / distance;

		// Calculate rotation (facing direction)
		const rotation = Math.atan2(normalizedX, -normalizedZ);

		// Update path line
		this.updatePathLine(currentPosition);

		return {
			x: normalizedX,
			z: normalizedZ,
			rotation,
		};
	}

	private updatePathLine(currentPosition: THREE.Vector3): void {
		if (!this.pathLine || !this.state.targetPosition) return;

		const points = [
			currentPosition.clone(),
			this.state.targetPosition.clone(),
		];
		points[0].y += 0.05;
		points[1].y += 0.05;

		const geometry = new THREE.BufferGeometry().setFromPoints(points);
		this.pathLine.geometry.dispose();
		this.pathLine.geometry = geometry;
		this.pathLine.computeLineDistances();
		this.pathLine.visible = true;
	}

	private arrive(): void {
		this.state.isMoving = false;

		if (this.targetMarker) {
			// Fade out animation
			const fadeOut = (): void => {
				if (!this.targetMarker) return;
				const material = this.targetMarker.material as THREE.MeshBasicMaterial;
				material.opacity -= 0.1;
				if (material.opacity > 0) {
					requestAnimationFrame(fadeOut);
				} else {
					this.targetMarker.visible = false;
					material.opacity = 0.8;
				}
			};
			fadeOut();
		}

		if (this.pathLine) {
			this.pathLine.visible = false;
		}

		this.state.targetPosition = null;

		if (this.onArrival) {
			this.onArrival();
		}
	}

	private animate = (): void => {
		if (!this.state.isMoving) {
			this.animationId = null;
			return;
		}

		this.animationId = requestAnimationFrame(this.animate);

		// Animate target marker
		if (this.targetMarker && this.targetMarker.visible) {
			const time = performance.now() * 0.002;
			this.targetMarker.rotation.z = time;
			const scale = 1 + Math.sin(time * 2) * 0.1;
			this.targetMarker.scale.set(scale, scale, 1);
		}
	};

	public getState(): Readonly<TapMoveState> {
		return { ...this.state };
	}

	public isMoving(): boolean {
		return this.state.isMoving;
	}

	public getTargetPosition(): THREE.Vector3 | null {
		return this.state.targetPosition?.clone() ?? null;
	}

	public dispose(): void {
		this.cancelMovement();

		if (this.targetMarker) {
			this.scene.remove(this.targetMarker);
			this.targetMarker.geometry.dispose();
			(this.targetMarker.material as THREE.Material).dispose();
			this.targetMarker = null;
		}

		if (this.pathLine) {
			this.scene.remove(this.pathLine);
			this.pathLine.geometry.dispose();
			(this.pathLine.material as THREE.Material).dispose();
			this.pathLine = null;
		}
	}
}
