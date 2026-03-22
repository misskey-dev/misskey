/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

export interface AgentData {
	id: string;
	itemId: string;
	nickname: string | null;
	fullness: number;
	happiness: number;
	level: number;
}

export interface AgentRenderConfig {
	followDistance: number;
	followSpeed: number;
	bobAmplitude: number;
	bobFrequency: number;
	scale: number;
}

const DEFAULT_CONFIG: AgentRenderConfig = {
	followDistance: 2.0,
	followSpeed: 3.0,
	bobAmplitude: 0.15,
	bobFrequency: 2.0,
	scale: 0.6,
};

/**
 * Agent/Pet renderer for Noctown.
 * Renders a companion that follows the player.
 */
export class AgentRenderer {
	private scene: THREE.Scene;
	private config: AgentRenderConfig;
	private agentMesh: THREE.Group | null = null;
	private agentData: AgentData | null = null;
	private targetPosition: THREE.Vector3 = new THREE.Vector3();
	private currentPosition: THREE.Vector3 = new THREE.Vector3();
	private time: number = 0;
	private isVisible: boolean = false;

	// Emotion particles
	private emotionParticles: THREE.Points | null = null;
	private emotionTime: number = 0;

	constructor(scene: THREE.Scene, config: Partial<AgentRenderConfig> = {}) {
		this.scene = scene;
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Set the equipped agent to render.
	 */
	public setAgent(agent: AgentData | null): void {
		if (!agent) {
			this.removeAgent();
			return;
		}

		this.agentData = agent;
		this.createAgentMesh();
		this.isVisible = true;
	}

	/**
	 * Remove the current agent from the scene.
	 */
	public removeAgent(): void {
		if (this.agentMesh) {
			this.scene.remove(this.agentMesh);
			this.agentMesh = null;
		}
		if (this.emotionParticles) {
			this.scene.remove(this.emotionParticles);
			this.emotionParticles = null;
		}
		this.agentData = null;
		this.isVisible = false;
	}

	/**
	 * Create the agent mesh based on item data.
	 */
	private createAgentMesh(): void {
		if (this.agentMesh) {
			this.scene.remove(this.agentMesh);
		}

		const group = new THREE.Group();

		// Body (sphere)
		const bodyGeometry = new THREE.SphereGeometry(0.4, 16, 16);
		const bodyMaterial = new THREE.MeshStandardMaterial({
			color: this.getAgentColor(),
			roughness: 0.7,
			metalness: 0.1,
		});
		const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.y = 0.4;
		body.castShadow = true;
		group.add(body);

		// Eyes
		const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
		const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });

		const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
		leftEye.position.set(-0.12, 0.5, 0.32);
		group.add(leftEye);

		const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
		rightEye.position.set(0.12, 0.5, 0.32);
		group.add(rightEye);

		// Eye highlights
		const highlightGeometry = new THREE.SphereGeometry(0.03, 6, 6);
		const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

		const leftHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
		leftHighlight.position.set(-0.1, 0.52, 0.38);
		group.add(leftHighlight);

		const rightHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
		rightHighlight.position.set(0.14, 0.52, 0.38);
		group.add(rightHighlight);

		// Cheeks (blush based on happiness)
		if (this.agentData && this.agentData.happiness > 50) {
			const cheekGeometry = new THREE.CircleGeometry(0.06, 8);
			const cheekMaterial = new THREE.MeshBasicMaterial({
				color: 0xff9999,
				transparent: true,
				opacity: this.agentData.happiness / 200,
			});

			const leftCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
			leftCheek.position.set(-0.22, 0.38, 0.35);
			leftCheek.rotation.y = Math.PI * 0.1;
			group.add(leftCheek);

			const rightCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
			rightCheek.position.set(0.22, 0.38, 0.35);
			rightCheek.rotation.y = -Math.PI * 0.1;
			group.add(rightCheek);
		}

		// Level indicator (small floating star for high level)
		if (this.agentData && this.agentData.level >= 3) {
			const starShape = new THREE.Shape();
			const outerRadius = 0.08;
			const innerRadius = 0.04;
			for (let i = 0; i < 5; i++) {
				const outerAngle = (i * Math.PI * 2) / 5 - Math.PI / 2;
				const innerAngle = outerAngle + Math.PI / 5;

				if (i === 0) {
					starShape.moveTo(Math.cos(outerAngle) * outerRadius, Math.sin(outerAngle) * outerRadius);
				} else {
					starShape.lineTo(Math.cos(outerAngle) * outerRadius, Math.sin(outerAngle) * outerRadius);
				}
				starShape.lineTo(Math.cos(innerAngle) * innerRadius, Math.sin(innerAngle) * innerRadius);
			}
			starShape.closePath();

			const starGeometry = new THREE.ShapeGeometry(starShape);
			const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide });
			const star = new THREE.Mesh(starGeometry, starMaterial);
			star.position.set(0, 0.95, 0);
			star.rotation.x = -Math.PI / 4;
			group.add(star);
		}

		group.scale.setScalar(this.config.scale);
		this.agentMesh = group;
		this.scene.add(group);
	}

	/**
	 * Get agent color based on item or random.
	 */
	private getAgentColor(): number {
		if (!this.agentData) return 0x88ccff;

		// Use itemId hash for consistent color
		let hash = 0;
		for (let i = 0; i < this.agentData.itemId.length; i++) {
			hash = ((hash << 5) - hash) + this.agentData.itemId.charCodeAt(i);
			hash |= 0;
		}

		// Generate pastel color
		const hue = Math.abs(hash % 360);
		const saturation = 60 + Math.abs((hash >> 8) % 20);
		const lightness = 65 + Math.abs((hash >> 16) % 15);

		return this.hslToHex(hue, saturation, lightness);
	}

	private hslToHex(h: number, s: number, l: number): number {
		s /= 100;
		l /= 100;
		const a = s * Math.min(l, 1 - l);
		const f = (n: number) => {
			const k = (n + h / 30) % 12;
			const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
			return Math.round(255 * color);
		};
		return (f(0) << 16) + (f(8) << 8) + f(4);
	}

	/**
	 * Update the agent position to follow the player.
	 */
	public update(deltaTime: number, playerPosition: THREE.Vector3, playerRotation: number): void {
		if (!this.agentMesh || !this.isVisible) return;

		this.time += deltaTime;

		// Calculate target position (behind and to the side of player)
		const offsetAngle = playerRotation + Math.PI * 0.8; // Behind and slightly to the left
		this.targetPosition.set(
			playerPosition.x + Math.sin(offsetAngle) * this.config.followDistance,
			playerPosition.y,
			playerPosition.z + Math.cos(offsetAngle) * this.config.followDistance,
		);

		// Smoothly move towards target
		const moveSpeed = this.config.followSpeed * deltaTime;
		this.currentPosition.lerp(this.targetPosition, Math.min(1, moveSpeed));

		// Add bobbing motion
		const bobOffset = Math.sin(this.time * this.config.bobFrequency * Math.PI * 2) * this.config.bobAmplitude;

		this.agentMesh.position.set(
			this.currentPosition.x,
			this.currentPosition.y + bobOffset,
			this.currentPosition.z,
		);

		// Face towards player
		const dirToPlayer = new THREE.Vector3()
			.subVectors(playerPosition, this.currentPosition)
			.normalize();
		const targetRotation = Math.atan2(dirToPlayer.x, dirToPlayer.z);
		this.agentMesh.rotation.y = targetRotation;

		// Update emotion particles
		this.updateEmotions(deltaTime);
	}

	/**
	 * Update emotion particle effects.
	 */
	private updateEmotions(deltaTime: number): void {
		if (!this.agentData || !this.agentMesh) return;

		this.emotionTime += deltaTime;

		// Show hearts when very happy
		if (this.agentData.happiness > 80 && Math.random() < 0.01) {
			this.spawnHeartParticle();
		}

		// Show sweat drops when hungry
		if (this.agentData.fullness < 30 && Math.random() < 0.02) {
			this.spawnSweatParticle();
		}
	}

	private spawnHeartParticle(): void {
		// Simple heart particle (would be better with proper particle system)
		if (!this.agentMesh) return;

		const heartGeometry = new THREE.SphereGeometry(0.05, 4, 4);
		const heartMaterial = new THREE.MeshBasicMaterial({ color: 0xff69b4 });
		const heart = new THREE.Mesh(heartGeometry, heartMaterial);

		heart.position.copy(this.agentMesh.position);
		heart.position.y += 0.8;
		heart.position.x += (Math.random() - 0.5) * 0.3;

		this.scene.add(heart);

		// Animate and remove
		const startY = heart.position.y;
		const animate = () => {
			heart.position.y += 0.02;
			heart.material.opacity -= 0.02;

			if (heart.position.y < startY + 1) {
				requestAnimationFrame(animate);
			} else {
				this.scene.remove(heart);
				heart.geometry.dispose();
				(heart.material as THREE.Material).dispose();
			}
		};
		animate();
	}

	private spawnSweatParticle(): void {
		if (!this.agentMesh) return;

		const sweatGeometry = new THREE.SphereGeometry(0.03, 4, 4);
		const sweatMaterial = new THREE.MeshBasicMaterial({ color: 0x87ceeb });
		const sweat = new THREE.Mesh(sweatGeometry, sweatMaterial);

		sweat.position.copy(this.agentMesh.position);
		sweat.position.y += 0.7;
		sweat.position.x += 0.25;

		this.scene.add(sweat);

		// Animate falling
		const animate = () => {
			sweat.position.y -= 0.03;

			if (sweat.position.y > this.agentMesh!.position.y - 0.5) {
				requestAnimationFrame(animate);
			} else {
				this.scene.remove(sweat);
				sweat.geometry.dispose();
				(sweat.material as THREE.Material).dispose();
			}
		};
		animate();
	}

	/**
	 * Set agent visibility.
	 */
	public setVisible(visible: boolean): void {
		this.isVisible = visible;
		if (this.agentMesh) {
			this.agentMesh.visible = visible;
		}
	}

	/**
	 * Get current agent data.
	 */
	public getAgentData(): AgentData | null {
		return this.agentData;
	}

	/**
	 * Update agent stats (for visual updates).
	 */
	public updateStats(fullness: number, happiness: number): void {
		if (this.agentData) {
			this.agentData.fullness = fullness;
			this.agentData.happiness = happiness;
			// Recreate mesh to update visuals
			this.createAgentMesh();
		}
	}

	/**
	 * Dispose of all resources.
	 */
	public dispose(): void {
		this.removeAgent();
	}
}
