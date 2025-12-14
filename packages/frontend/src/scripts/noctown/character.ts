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

	// Linear interpolation for remote players (FR-070)
	private lerpEnabled: boolean = false;
	private lerpStartPos: THREE.Vector3 | null = null;
	private lerpTargetPos: THREE.Vector3 | null = null;
	private lerpStartTime: number = 0;
	private lerpDuration: number = 100; // 100ms lerp duration

	// Body parts
	private torso!: THREE.Mesh;
	private head!: THREE.Mesh;
	private headMaterials: THREE.Material[];
	private headGroup!: THREE.Group;
	private backHair!: THREE.Mesh;
	private topHair!: THREE.Mesh;
	private leftSideHair!: THREE.Mesh;
	private rightSideHair!: THREE.Mesh;
	private leftShoe!: THREE.Mesh;
	private rightShoe!: THREE.Mesh;

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

	// Chat bubble sprite
	private chatSprite!: THREE.Sprite;
	private chatCanvas!: HTMLCanvasElement;
	private chatContext!: CanvasRenderingContext2D;
	private chatTexture!: THREE.CanvasTexture;
	private chatTimer: number = 0;
	private chatDuration: number = 5.0;

	// FR-019: Typing indicator sprite
	private typingSprite!: THREE.Sprite;
	private typingCanvas!: HTMLCanvasElement;
	private typingContext!: CanvasRenderingContext2D;
	private typingTexture!: THREE.CanvasTexture;
	private typingAnimationPhase: number = 0;

	// Name display (character-demo+9-player-name.html準拠)
	private nameSprite!: THREE.Sprite;
	private nameCanvas!: HTMLCanvasElement;
	private nameContext!: CanvasRenderingContext2D;
	private nameTexture!: THREE.CanvasTexture;
	private accountName: string = 'Player'; // Default name
	private isOnline: boolean = true; // Default online status

	// FR-017: プレイヤー名前マークの色仕様
	public lastPingTime: number = 0; // Date.now()のタイムスタンプ
	public lastPingResponseTime: number = 0; // 最後のpong応答時間（ms）
	private statusMarkColor: string = '#44ff44'; // デフォルトは緑
	private isLocalPlayer: boolean = false; // 自プレイヤーフラグ

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
		this.createChatSprite();
		this.createTypingSprite();
		this.createNameSprite();
	}

	private createBody(): void {
		// Girl2 color scheme (character-cute-v4.html)
		const bodyColor = 0xff91a4;    // Pink dress
		const skinColor = 0xffdbac;
		const hairColor = 0x5c3317;    // Brown hair
		const pantsColor = 0x4a5568;
		const shoeColor = 0x2a2a2a;

		// Torso (body)
		const torsoGeo = new THREE.BoxGeometry(0.8, 1, 0.5);
		const torsoMat = new THREE.MeshStandardMaterial({ color: bodyColor });
		this.torso = new THREE.Mesh(torsoGeo, torsoMat);
		this.torso.position.y = 1.5;
		this.torso.castShadow = true;
		this.group.add(this.torso);

		// Head group
		this.headGroup = new THREE.Group();
		this.headGroup.position.y = 2.55;
		this.group.add(this.headGroup);

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
		this.head.position.y = -0.1; // FR-010: Torso上端(y=2.0)に接続するように調整
		this.head.castShadow = true;
		this.headGroup.add(this.head);

		// Cheeks (ほっぺ)
		const cheekGeo = new THREE.BoxGeometry(0.02, 0.12, 0.15);
		const cheekMat = new THREE.MeshStandardMaterial({
			color: 0xffaaaa,
			transparent: true,
			opacity: 0.7,
		});

		// Left cheek
		const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
		leftCheek.position.set(-0.46, -0.1, 0.2);
		leftCheek.castShadow = true;
		this.headGroup.add(leftCheek);

		// Right cheek
		const rightCheek = new THREE.Mesh(cheekGeo, cheekMat.clone());
		rightCheek.position.set(0.46, -0.1, 0.2);
		rightCheek.castShadow = true;
		this.headGroup.add(rightCheek);

		// Hair parts
		const hairMat = new THREE.MeshStandardMaterial({ color: hairColor });

		// Back hair
		const backHairGeo = new THREE.BoxGeometry(1.1, 1.4, 0.5);
		this.backHair = new THREE.Mesh(backHairGeo, hairMat);
		this.backHair.position.set(0, -0.25, -0.5);
		this.backHair.castShadow = true;
		this.headGroup.add(this.backHair);

		// Top hair
		const topHairGeo = new THREE.BoxGeometry(1.0, 0.3, 1.0);
		this.topHair = new THREE.Mesh(topHairGeo, hairMat);
		this.topHair.position.set(0, 0.55, -0.05);
		this.topHair.castShadow = true;
		this.headGroup.add(this.topHair);

		// Left side hair
		const leftSideHairGeo = new THREE.BoxGeometry(0.25, 1.2, 0.8);
		this.leftSideHair = new THREE.Mesh(leftSideHairGeo, hairMat);
		this.leftSideHair.position.set(-0.55, -0.15, -0.05);
		this.leftSideHair.castShadow = true;
		this.headGroup.add(this.leftSideHair);

		// Right side hair
		const rightSideHairGeo = new THREE.BoxGeometry(0.25, 1.2, 0.8);
		this.rightSideHair = new THREE.Mesh(rightSideHairGeo, hairMat);
		this.rightSideHair.position.set(0.55, -0.15, -0.05);
		this.rightSideHair.castShadow = true;
		this.headGroup.add(this.rightSideHair);

		// Bangs (前髪)
		const bangsGeo = new THREE.BoxGeometry(0.95, 0.2, 0.15);
		const bangs = new THREE.Mesh(bangsGeo, hairMat);
		bangs.position.set(0, 0.38, 0.48);
		bangs.castShadow = true;
		this.headGroup.add(bangs);

		// Ribbon (リボン) - BufferGeometry implementation
		const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xff1493 }); // Deep pink

		// Create ribbon geometry
		const ribbonGeometry = this.createRibbonGeometry();
		const ribbon = new THREE.Mesh(ribbonGeometry, ribbonMat);
		ribbon.position.set(0, 0.05, -0.55);
		ribbon.castShadow = true;
		this.headGroup.add(ribbon);

		// Arms with pivot groups and sleeves
		const armGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
		const armMat = new THREE.MeshStandardMaterial({ color: skinColor });
		const sleeveGeo = new THREE.BoxGeometry(0.28, 0.4, 0.28);
		const sleeveMat = new THREE.MeshStandardMaterial({ color: bodyColor });

		// Left arm pivot
		this.leftArmPivot = new THREE.Group();
		this.leftArmPivot.position.set(-0.55, 1.9, 0);
		this.leftArm = new THREE.Mesh(armGeo, armMat.clone());
		this.leftArm.position.y = -0.4;
		this.leftArm.castShadow = true;
		this.leftArmPivot.add(this.leftArm);

		// Left sleeve
		const leftSleeve = new THREE.Mesh(sleeveGeo, sleeveMat.clone());
		leftSleeve.position.y = -0.2;
		leftSleeve.castShadow = true;
		this.leftArmPivot.add(leftSleeve);

		this.group.add(this.leftArmPivot);

		// Right arm pivot
		this.rightArmPivot = new THREE.Group();
		this.rightArmPivot.position.set(0.55, 1.9, 0);
		this.rightArm = new THREE.Mesh(armGeo, armMat.clone());
		this.rightArm.position.y = -0.4;
		this.rightArm.castShadow = true;
		this.rightArmPivot.add(this.rightArm);

		// Right sleeve
		const rightSleeve = new THREE.Mesh(sleeveGeo, sleeveMat.clone());
		rightSleeve.position.y = -0.2;
		rightSleeve.castShadow = true;
		this.rightArmPivot.add(rightSleeve);

		this.group.add(this.rightArmPivot);

		// Legs with pivot groups
		const legGeo = new THREE.BoxGeometry(0.3, 0.8, 0.3);
		const legMat = new THREE.MeshStandardMaterial({ color: pantsColor });

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

		// Shoes (独立メッシュ)
		const shoeGeo = new THREE.BoxGeometry(0.32, 0.15, 0.38);
		const shoeMat = new THREE.MeshStandardMaterial({ color: shoeColor });

		// Left shoe
		this.leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
		this.leftShoe.position.set(-0.2, 0.08, 0.02);
		this.leftShoe.castShadow = true;
		this.group.add(this.leftShoe);

		// Right shoe
		this.rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
		this.rightShoe.position.set(0.2, 0.08, 0.02);
		this.rightShoe.castShadow = true;
		this.group.add(this.rightShoe);

		// Collar (襟)
		const collarGeo = new THREE.BoxGeometry(0.46, 0.08, 0.54);
		const collarMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
		const collar = new THREE.Mesh(collarGeo, collarMat);
		collar.position.set(0, 2.01, 0.02);
		collar.castShadow = true;
		this.group.add(collar);

		// Chest ribbon (胸元リボン)
		const chestRibbonMat = new THREE.MeshStandardMaterial({ color: 0xff1493 });

		// Center knot
		const chestRibbonCenter = new THREE.Mesh(
			new THREE.BoxGeometry(0.08, 0.08, 0.06),
			chestRibbonMat,
		);
		chestRibbonCenter.position.set(0, 1.88, 0.26);
		chestRibbonCenter.castShadow = true;
		this.group.add(chestRibbonCenter);

		// Left wing
		const chestRibbonLeft = new THREE.Mesh(
			new THREE.BoxGeometry(0.14, 0.06, 0.04),
			chestRibbonMat.clone(),
		);
		chestRibbonLeft.position.set(-0.11, 1.88, 0.26);
		chestRibbonLeft.rotation.z = 0.3;
		chestRibbonLeft.castShadow = true;
		this.group.add(chestRibbonLeft);

		// Right wing
		const chestRibbonRight = new THREE.Mesh(
			new THREE.BoxGeometry(0.14, 0.06, 0.04),
			chestRibbonMat.clone(),
		);
		chestRibbonRight.position.set(0.11, 1.88, 0.26);
		chestRibbonRight.rotation.z = -0.3;
		chestRibbonRight.castShadow = true;
		this.group.add(chestRibbonRight);
	}

	/**
	 * Create ribbon geometry using BufferGeometry
	 * Based on character-cute-v4.html implementation
	 */
	private createRibbonGeometry(): THREE.BufferGeometry {
		const geometry = new THREE.BufferGeometry();
		const vertices: number[] = [];
		const indices: number[] = [];

		// Ribbon wing parameters
		const wingSegments = 24;
		const wingRows = 8;
		const wingWidth = 0.14;
		const wingHeight = 0.09;

		// Left wing
		for (let row = 0; row <= wingRows; row++) {
			const rowT = row / wingRows;
			const thickness = Math.sin(rowT * Math.PI) * 0.025;

			for (let i = 0; i <= wingSegments; i++) {
				const t = i / wingSegments;
				const x = -t * wingWidth;
				const y = Math.sin(t * Math.PI) * wingHeight * (1 - rowT * 0.3);
				const z = thickness - 0.0125;

				vertices.push(x, y, z);
			}
		}

		// Left wing indices
		for (let row = 0; row < wingRows; row++) {
			for (let i = 0; i < wingSegments; i++) {
				const a = row * (wingSegments + 1) + i;
				const b = a + 1;
				const c = a + wingSegments + 1;
				const d = c + 1;
				indices.push(a, c, b);
				indices.push(b, c, d);
			}
		}

		// Right wing (mirror left wing)
		const leftWingVertexCount = vertices.length / 3;
		for (let row = 0; row <= wingRows; row++) {
			const rowT = row / wingRows;
			const thickness = Math.sin(rowT * Math.PI) * 0.025;

			for (let i = 0; i <= wingSegments; i++) {
				const t = i / wingSegments;
				const x = t * wingWidth;
				const y = Math.sin(t * Math.PI) * wingHeight * (1 - rowT * 0.3);
				const z = thickness - 0.0125;

				vertices.push(x, y, z);
			}
		}

		// Right wing indices
		for (let row = 0; row < wingRows; row++) {
			for (let i = 0; i < wingSegments; i++) {
				const a = leftWingVertexCount + row * (wingSegments + 1) + i;
				const b = a + 1;
				const c = a + wingSegments + 1;
				const d = c + 1;
				indices.push(a, c, b);
				indices.push(b, c, d);
			}
		}

		// Ribbon tail parameters
		const tailSegments = 16;
		const tailRows = 6;
		const tailWidth = 0.08;
		const tailLength = 0.2;

		// Left tail
		const tailStartVertexCount = vertices.length / 3;
		for (let row = 0; row <= tailRows; row++) {
			const rowT = row / tailRows;
			const thickness = Math.sin(rowT * Math.PI) * 0.02;

			for (let i = 0; i <= tailSegments; i++) {
				const t = i / tailSegments;
				const x = -t * tailWidth;
				const y = -t * tailLength;
				const z = thickness - 0.01;

				vertices.push(x, y, z);
			}
		}

		// Left tail indices
		for (let row = 0; row < tailRows; row++) {
			for (let i = 0; i < tailSegments; i++) {
				const a = tailStartVertexCount + row * (tailSegments + 1) + i;
				const b = a + 1;
				const c = a + tailSegments + 1;
				const d = c + 1;
				indices.push(a, c, b);
				indices.push(b, c, d);
			}
		}

		// Right tail
		const rightTailStartVertexCount = vertices.length / 3;
		for (let row = 0; row <= tailRows; row++) {
			const rowT = row / tailRows;
			const thickness = Math.sin(rowT * Math.PI) * 0.02;

			for (let i = 0; i <= tailSegments; i++) {
				const t = i / tailSegments;
				const x = t * tailWidth;
				const y = -t * tailLength;
				const z = thickness - 0.01;

				vertices.push(x, y, z);
			}
		}

		// Right tail indices
		for (let row = 0; row < tailRows; row++) {
			for (let i = 0; i < tailSegments; i++) {
				const a = rightTailStartVertexCount + row * (tailSegments + 1) + i;
				const b = a + 1;
				const c = a + tailSegments + 1;
				const d = c + 1;
				indices.push(a, c, b);
				indices.push(b, c, d);
			}
		}

		// Center knot
		const knotSegments = 8;
		const knotRadius = 0.05;
		const knotStartVertexCount = vertices.length / 3;

		// Front layer
		for (let i = 0; i <= knotSegments; i++) {
			const angle = (i / knotSegments) * Math.PI * 2;
			const x = Math.cos(angle) * knotRadius;
			const y = Math.sin(angle) * knotRadius;
			const z = 0.02;

			vertices.push(x, y, z);
		}

		// Back layer
		for (let i = 0; i <= knotSegments; i++) {
			const angle = (i / knotSegments) * Math.PI * 2;
			const x = Math.cos(angle) * knotRadius;
			const y = Math.sin(angle) * knotRadius;
			const z = -0.02;

			vertices.push(x, y, z);
		}

		// Knot indices (connect front and back layers)
		for (let i = 0; i < knotSegments; i++) {
			const a = knotStartVertexCount + i;
			const b = a + 1;
			const c = knotStartVertexCount + knotSegments + 1 + i;
			const d = c + 1;
			indices.push(a, c, b);
			indices.push(b, c, d);
		}

		// Set attributes
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		geometry.setIndex(indices);
		geometry.computeVertexNormals();

		return geometry;
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

		// 仕様: 吹き出しの三角形（しっぽ）を下向きに描画
		// Canvas座標系とThree.jsテクスチャの関係で上下反転するため、
		// Canvasでは上向き（頂点が上）に描画することで、表示時に下向きになる
		// 修正日: 2025-12-14
		this.emoteContext.fillStyle = '#ffffff';
		this.emoteContext.beginPath();
		this.emoteContext.moveTo(64, 14);  // 頂点（Canvas上では上、表示時は下）
		this.emoteContext.lineTo(54, 4);   // 左
		this.emoteContext.lineTo(74, 4);   // 右
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
	 * Create chat bubble sprite above character head
	 * T135, T136, T137: Chat bubble with rounded rect, triangle tail, black border
	 */
	private createChatSprite(): void {
		// T136: Create 512x256 canvas for chat bubble
		this.chatCanvas = document.createElement('canvas');
		this.chatCanvas.width = 512;
		this.chatCanvas.height = 256;
		this.chatContext = this.chatCanvas.getContext('2d')!;

		// Create texture from canvas
		this.chatTexture = new THREE.CanvasTexture(this.chatCanvas);
		this.chatTexture.minFilter = THREE.LinearFilter;
		this.chatTexture.magFilter = THREE.LinearFilter;

		// Create sprite material
		const material = new THREE.SpriteMaterial({
			map: this.chatTexture,
			transparent: true,
			opacity: 1,
		});

		// Create sprite
		this.chatSprite = new THREE.Sprite(material);
		this.chatSprite.position.y = 4; // T140: Above head
		this.chatSprite.scale.set(5, 2.5, 1); // Scale 5x2.5 for 512x256 canvas
		this.chatSprite.visible = false;
		this.group.add(this.chatSprite);
	}

	/**
	 * FR-019: Create typing indicator sprite above character head
	 * Displays animated speech bubble icon while player is typing
	 */
	private createTypingSprite(): void {
		// Create 128x128 canvas for typing indicator
		this.typingCanvas = document.createElement('canvas');
		this.typingCanvas.width = 128;
		this.typingCanvas.height = 128;
		this.typingContext = this.typingCanvas.getContext('2d')!;

		// Create texture from canvas
		this.typingTexture = new THREE.CanvasTexture(this.typingCanvas);
		this.typingTexture.minFilter = THREE.LinearFilter;
		this.typingTexture.magFilter = THREE.LinearFilter;

		// Create sprite material
		const material = new THREE.SpriteMaterial({
			map: this.typingTexture,
			transparent: true,
			opacity: 1,
		});

		// Create sprite
		this.typingSprite = new THREE.Sprite(material);
		this.typingSprite.position.y = 4; // Above head (same as emote/chat)
		this.typingSprite.scale.set(1.5, 1.5, 1);
		this.typingSprite.visible = false;
		this.group.add(this.typingSprite);
	}

	/**
	 * FR-019: Render typing indicator to canvas
	 * Draws a speech bubble icon with animated dots
	 */
	private renderTypingIndicator(): void {
		const ctx = this.typingContext;
		ctx.clearRect(0, 0, 128, 128);

		// Draw white circle background
		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.arc(64, 54, 40, 0, Math.PI * 2);
		ctx.fill();

		// Draw black border
		ctx.strokeStyle = '#000000';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.arc(64, 54, 40, 0, Math.PI * 2);
		ctx.stroke();

		// 仕様: 吹き出しの三角形（しっぽ）を下向きに描画
		// Canvas座標系とThree.jsテクスチャの関係で上下反転するため、
		// Canvasでは上向き（頂点が上）に描画することで、表示時に下向きになる
		// 修正日: 2025-12-14
		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.moveTo(64, 14);  // 頂点（Canvas上では上、表示時は下）
		ctx.lineTo(54, 4);   // 左
		ctx.lineTo(74, 4);   // 右
		ctx.closePath();
		ctx.fill();
		ctx.stroke();

		// Draw animated three dots (...)
		// Phase cycles 0 -> 1 -> 2 -> 0
		const dotRadius = 6;
		const dotY = 54;
		const dotSpacing = 20;
		const baseX = 64 - dotSpacing;

		for (let i = 0; i < 3; i++) {
			// Calculate opacity based on animation phase
			// Each dot fades in sequence
			const dotPhase = (this.typingAnimationPhase + i * 0.33) % 1;
			const opacity = 0.3 + 0.7 * Math.sin(dotPhase * Math.PI);

			ctx.fillStyle = `rgba(102, 102, 102, ${opacity})`;
			ctx.beginPath();
			ctx.arc(baseX + i * dotSpacing, dotY, dotRadius, 0, Math.PI * 2);
			ctx.fill();
		}

		// Update texture
		this.typingTexture.needsUpdate = true;
	}

	/**
	 * FR-019: Show or hide typing indicator
	 * @param show Whether to show the typing indicator
	 */
	public showTypingIndicator(show: boolean): void {
		this.typingSprite.visible = show;
		if (show) {
			this.typingAnimationPhase = 0;
			this.renderTypingIndicator();
		}
	}

	/**
	 * T004: Create name sprite at character's feet
	 * Based on character-demo+9-player-name.html implementation
	 */
	private createNameSprite(): void {
		// Create 512x128 canvas for name display
		this.nameCanvas = document.createElement('canvas');
		this.nameCanvas.width = 512;
		this.nameCanvas.height = 128;
		this.nameContext = this.nameCanvas.getContext('2d')!;

		// Create texture from canvas
		this.nameTexture = new THREE.CanvasTexture(this.nameCanvas);
		this.nameTexture.minFilter = THREE.LinearFilter;

		// Create sprite material (depthTest: false to avoid hiding behind objects)
		const material = new THREE.SpriteMaterial({
			map: this.nameTexture,
			transparent: true,
			depthTest: false,
		});

		// Create sprite
		this.nameSprite = new THREE.Sprite(material);
		this.nameSprite.position.y = -0.3; // At character's feet
		this.nameSprite.scale.set(3, 0.75, 1); // Scale 3x0.75
		this.group.add(this.nameSprite);

		// Initialize name sprite rendering
		this.updateNameSprite();
	}

	/**
	 * T005: Update name sprite canvas rendering
	 * Draws background, online/offline status mark, and username
	 */
	private updateNameSprite(): void {
		const ctx = this.nameContext;
		ctx.clearRect(0, 0, 512, 128);

		// T010: Use default name if accountName is empty
		const displayName = this.accountName.trim() === '' ? 'Player' : this.accountName;

		// Measure text width
		ctx.font = 'bold 40px Arial';
		const textWidth = ctx.measureText(displayName).width;
		const circleRadius = 12;
		const padding = 30;
		const gap = 15;
		const totalWidth = circleRadius * 2 + gap + textWidth + padding * 2;
		const bgX = 256 - totalWidth / 2;

		// T005: Draw background (semi-transparent black with rounded corners)
		ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
		ctx.beginPath();
		ctx.roundRect(bgX, 30, totalWidth, 68, 15);
		ctx.fill();

		// T005: Draw online/offline status mark (circle)
		const circleX = bgX + padding + circleRadius;
		const circleY = 64;
		ctx.beginPath();
		ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
		ctx.fillStyle = this.isOnline ? '#44ff44' : '#ff4444'; // Green for online, red for offline
		ctx.fill();

		// T005: Draw username text (white, bold, 40px Arial)
		ctx.fillStyle = 'white';
		ctx.font = 'bold 40px Arial';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.fillText(displayName, circleX + circleRadius + gap, 64);

		// T009: Mark texture as needing update
		this.nameTexture.needsUpdate = true;
	}

	/**
	 * T006: Set player name and update name sprite
	 * @param name Player username (max 12 characters)
	 */
	public setName(name: string): void {
		// T011: Limit name to 12 characters
		this.accountName = name.substring(0, 12);
		this.updateNameSprite();
	}

	/**
	 * T007: Set online/offline status and update name sprite
	 * @param online Online status (true = online/green, false = offline/red)
	 */
	public setOnline(online: boolean): void {
		this.isOnline = online;
		this.updateNameSprite();
	}

	/**
	 * FR-017: Set name label (status mark) color and update sprite
	 * @param color Hex color string (e.g., '#00ff00')
	 */
	public setNameLabelColor(color: string): void {
		this.statusMarkColor = color;
		this.updateNameSpriteWithColor();
	}

	/**
	 * FR-017: Update ping status and calculate color from response time
	 * RGB linear interpolation: 0ms = green (0,255,0), 500ms = red (255,0,0)
	 * @param responseTimeMs Ping response time in milliseconds
	 */
	public updatePingStatus(responseTimeMs: number): void {
		// Skip color calculation for local player (always green)
		if (this.isLocalPlayer) return;

		this.lastPingResponseTime = responseTimeMs;
		this.lastPingTime = Date.now();

		// Clamp to 0-500ms range
		const clampedTime = Math.max(0, Math.min(500, responseTimeMs));

		// RGB linear interpolation
		// R = (ping / 500) * 255, G = ((500 - ping) / 500) * 255, B = 0
		const r = Math.round((clampedTime / 500) * 255);
		const g = Math.round(((500 - clampedTime) / 500) * 255);
		const b = 0;

		// Convert to hex color
		this.statusMarkColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
		this.updateNameSpriteWithColor();
	}

	/**
	 * FR-017: Set warning color (yellow) for players with 3+ seconds since last ping
	 */
	public setWarningColor(): void {
		// Skip warning for local player (always green)
		if (this.isLocalPlayer) return;

		this.statusMarkColor = '#ffff00'; // Yellow warning
		this.updateNameSpriteWithColor();
	}

	/**
	 * FR-017: Mark this character as the local player (always green)
	 */
	public setAsLocalPlayer(): void {
		this.isLocalPlayer = true;
		this.statusMarkColor = '#00ff00'; // Permanent green for local player
		this.updateNameSpriteWithColor();
	}

	/**
	 * 仕様: プレイヤーが警告色（黄色）を表示すべきかチェック
	 * 変更: ping間隔を30秒に変更したため、警告時間も30秒に延長
	 * 修正日: 2025-12-14
	 * @returns true if warning should be displayed
	 */
	public needsWarningColor(): boolean {
		if (this.isLocalPlayer) return false;
		if (this.lastPingTime === 0) return false;

		const timeSinceLastPing = Date.now() - this.lastPingTime;
		return timeSinceLastPing >= 30000; // 30 seconds
	}

	/**
	 * FR-017: Update name sprite with current status mark color
	 * Similar to updateNameSprite but uses statusMarkColor instead of isOnline
	 */
	private updateNameSpriteWithColor(): void {
		const ctx = this.nameContext;
		ctx.clearRect(0, 0, 512, 128);

		// Use default name if accountName is empty
		const displayName = this.accountName.trim() === '' ? 'Player' : this.accountName;

		// Measure text width
		ctx.font = 'bold 40px Arial';
		const textWidth = ctx.measureText(displayName).width;
		const circleRadius = 12;
		const padding = 30;
		const gap = 15;
		const totalWidth = circleRadius * 2 + gap + textWidth + padding * 2;
		const bgX = 256 - totalWidth / 2;

		// Draw background (semi-transparent black with rounded corners)
		ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
		ctx.beginPath();
		ctx.roundRect(bgX, 30, totalWidth, 68, 15);
		ctx.fill();

		// Draw status mark (circle) with current statusMarkColor
		const circleX = bgX + padding + circleRadius;
		const circleY = 64;
		ctx.beginPath();
		ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
		ctx.fillStyle = this.statusMarkColor;
		ctx.fill();

		// Draw username text (white, bold, 40px Arial)
		ctx.fillStyle = 'white';
		ctx.font = 'bold 40px Arial';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.fillText(displayName, circleX + circleRadius + gap, 64);

		// Mark texture as needing update
		this.nameTexture.needsUpdate = true;
	}

	/**
	 * Show chat message above character head
	 * T136-T141: Chat bubble implementation
	 * @param message Chat message text (max 100 characters)
	 */
	public showChatMessage(message: string): void {
		// T147: Allow chat override
		this.chatTimer = 0;
		this.chatSprite.visible = true;

		// Clear canvas
		this.chatContext.clearRect(0, 0, 512, 256);

		// FR-007-5: 文字数に応じて吹き出しサイズを動的に調整
		const padding = 20;
		const cornerRadius = 15;
		const lineHeight = 36;
		const maxLines = 3;

		// フォント設定（テキスト幅測定のため先に設定）
		this.chatContext.font = 'bold 28px sans-serif';

		// テキストを折り返して行数を計算（最大幅480px - padding）
		const maxTextWidth = 480 - padding * 2;
		const lines = this.wrapText(message, maxTextWidth, maxLines);

		// 各行の実際の幅を測定して最大幅を取得
		let actualMaxWidth = 0;
		for (const line of lines) {
			const metrics = this.chatContext.measureText(line);
			actualMaxWidth = Math.max(actualMaxWidth, metrics.width);
		}

		// 吹き出しサイズを計算（最小幅100px、最大幅480px）
		const bubbleWidth = Math.max(100, Math.min(480, actualMaxWidth + padding * 2));
		const bubbleHeight = lines.length * lineHeight + padding * 2 + 20; // 20pxは上下の余白
		const bubbleX = (512 - bubbleWidth) / 2; // 中央配置
		const bubbleY = 16;

		// Draw rounded rectangle background
		this.chatContext.fillStyle = '#ffffff';
		this.chatContext.strokeStyle = '#000000';
		this.chatContext.lineWidth = 3;

		this.chatContext.beginPath();
		this.chatContext.moveTo(bubbleX + cornerRadius, bubbleY);
		this.chatContext.lineTo(bubbleX + bubbleWidth - cornerRadius, bubbleY);
		this.chatContext.quadraticCurveTo(bubbleX + bubbleWidth, bubbleY, bubbleX + bubbleWidth, bubbleY + cornerRadius);
		this.chatContext.lineTo(bubbleX + bubbleWidth, bubbleY + bubbleHeight - cornerRadius);
		this.chatContext.quadraticCurveTo(bubbleX + bubbleWidth, bubbleY + bubbleHeight, bubbleX + bubbleWidth - cornerRadius, bubbleY + bubbleHeight);

		// Draw triangle tail
		const tailX = bubbleX + bubbleWidth / 2;
		const tailY = bubbleY + bubbleHeight;
		this.chatContext.lineTo(tailX + 20, tailY);
		this.chatContext.lineTo(tailX, tailY + 30);
		this.chatContext.lineTo(tailX - 20, tailY);

		this.chatContext.lineTo(bubbleX + cornerRadius, bubbleY + bubbleHeight);
		this.chatContext.quadraticCurveTo(bubbleX, bubbleY + bubbleHeight, bubbleX, bubbleY + bubbleHeight - cornerRadius);
		this.chatContext.lineTo(bubbleX, bubbleY + cornerRadius);
		this.chatContext.quadraticCurveTo(bubbleX, bubbleY, bubbleX + cornerRadius, bubbleY);
		this.chatContext.closePath();

		this.chatContext.fill();
		this.chatContext.stroke();

		// T138, T139: Draw text with auto line-break, max 3 lines, ellipsis
		this.chatContext.fillStyle = '#000000';
		this.chatContext.textAlign = 'left';
		this.chatContext.textBaseline = 'top';

		const textX = bubbleX + padding;
		let textY = bubbleY + padding + 10;

		lines.forEach((line) => {
			this.chatContext.fillText(line, textX, textY);
			textY += lineHeight;
		});

		// Update texture
		this.chatTexture.needsUpdate = true;
	}

	/**
	 * Wrap text to fit within max width, with max lines and ellipsis
	 * T138, T139: Auto line-break with max 3 lines
	 */
	private wrapText(text: string, maxWidth: number, maxLines: number): string[] {
		const words = text.split('');
		const lines: string[] = [];
		let currentLine = '';

		for (let i = 0; i < words.length; i++) {
			const testLine = currentLine + words[i];
			const metrics = this.chatContext.measureText(testLine);

			if (metrics.width > maxWidth && currentLine.length > 0) {
				lines.push(currentLine);
				currentLine = words[i];

				// If we've reached max lines, add ellipsis and stop
				if (lines.length >= maxLines) {
					currentLine = currentLine.slice(0, -1) + '…';
					break;
				}
			} else {
				currentLine = testLine;
			}
		}

		if (currentLine.length > 0 && lines.length < maxLines) {
			lines.push(currentLine);
		}

		return lines;
	}

	/**
	 * Initialize name display sprite (character-demo+12準拠)
	 * @param username Username to display (maxlength 12)
	 */
	public initializeName(username: string): void {
		// Truncate username to 12 characters
		const displayName = username.substring(0, 12);

		// Create canvas for name
		this.nameCanvas = document.createElement('canvas');
		this.nameCanvas.width = 256;
		this.nameCanvas.height = 64;
		this.nameContext = this.nameCanvas.getContext('2d')!;

		// Draw background (semi-transparent white)
		this.nameContext.fillStyle = 'rgba(255, 255, 255, 0.8)';
		this.nameContext.fillRect(0, 0, this.nameCanvas.width, this.nameCanvas.height);

		// Draw text
		this.nameContext.font = 'bold 28px Arial';
		this.nameContext.fillStyle = '#333';
		this.nameContext.textAlign = 'center';
		this.nameContext.textBaseline = 'middle';
		this.nameContext.fillText(displayName, this.nameCanvas.width / 2, this.nameCanvas.height / 2);

		// Create texture and sprite
		this.nameTexture = new THREE.CanvasTexture(this.nameCanvas);
		const material = new THREE.SpriteMaterial({
			map: this.nameTexture,
			depthTest: false,
		});
		this.nameSprite = new THREE.Sprite(material);
		this.nameSprite.position.y = -0.3; // character-demo+12準拠
		this.nameSprite.scale.set(3, 0.75, 1); // character-demo+12準拠
		this.group.add(this.nameSprite);
	}

	/**
	 * Set icon texture on head front face
	 * @param url Icon image URL (nullの場合はデフォルトアイコンを使用)
	 * @param username ユーザー名（デフォルトアイコン生成用）
	 */
	public setIcon(url: string | null, username: string): void {
		const host = location.host;
		const iconUrl = url || `https://${host}/identicon/${username}@${host}`;
		const loader = new THREE.TextureLoader();
		loader.crossOrigin = 'anonymous';
		loader.load(
			iconUrl,
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
	 * 仕様: 入力とデルタ時間に基づいてキャラクターを更新
	 * 修正: 向き計算を修正（マイナス符号を削除）
	 * 修正日: 2025-12-14
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

			// 仕様: 移動方向にキャラクターを向かせる
			// キャラクターの顔（アイコン）は+Z方向にあるため、
			// 移動方向(moveDir.x, moveDir.z)に向かせるにはatan2(moveDir.x, moveDir.z)を使用
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
			this.headGroup.position.y = 2.55 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.05;
		} else {
			// Idle - return to neutral pose
			this.walkCycle = 0;
			this.leftArmPivot.rotation.x *= 0.85;
			this.rightArmPivot.rotation.x *= 0.85;
			this.leftLegPivot.rotation.x *= 0.85;
			this.rightLegPivot.rotation.x *= 0.85;

			this.torso.position.y = 1.5;
			this.headGroup.position.y = 2.55;
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
		if (this.lerpEnabled) {
			// Store current position as lerp start
			this.lerpStartPos = this.group.position.clone();
			this.lerpTargetPos = new THREE.Vector3(x, y, z);
			this.lerpStartTime = performance.now();
		} else {
			this.group.position.set(x, y, z);
		}
	}

	/**
	 * Enable linear interpolation for remote players (FR-070)
	 */
	public enableLerp(duration: number = 100): void {
		this.lerpEnabled = true;
		this.lerpDuration = duration;
	}

	/**
	 * Update lerp position (call every frame)
	 */
	public updateLerp(): void {
		if (!this.lerpEnabled || !this.lerpStartPos || !this.lerpTargetPos) return;

		const now = performance.now();
		const elapsed = now - this.lerpStartTime;
		const t = Math.min(elapsed / this.lerpDuration, 1.0);

		// Linear interpolation
		this.group.position.lerpVectors(this.lerpStartPos, this.lerpTargetPos, t);

		// Clear lerp state when done
		if (t >= 1.0) {
			this.lerpStartPos = null;
			this.lerpTargetPos = null;
		}
	}

	/**
	 * 仕様: 移動方向に基づいてアニメーションを更新
	 * 修正: 向き計算を修正（マイナス符号を削除）- キャラクターの顔は+Z方向にあるため、
	 *       移動方向にそのまま向かせる（atan2(moveX, moveZ)）
	 * 修正日: 2025-12-14
	 * @param moveX Normalized movement direction X (-1 to 1)
	 * @param moveZ Normalized movement direction Z (-1 to 1)
	 * @param deltaTime Delta time in seconds
	 */
	public updateAnimation(moveX: number = 0, moveZ: number = 0, deltaTime: number = 0.016): void {
		// Determine if moving based on movement input
		const moveLength = Math.sqrt(moveX * moveX + moveZ * moveZ);
		this.isMoving = moveLength > 0;

		// Update target rotation even when not moving (for remote players)
		// This ensures rotation updates when receiving small position changes from WebSocket
		if (moveLength > 0.0001) {
			// 仕様: 移動方向にキャラクターを向かせる
			// キャラクターの顔（アイコン）は+Z方向にあるため、
			// 移動方向(moveX, moveZ)に向かせるにはatan2(moveX, moveZ)を使用
			this.targetRotation = Math.atan2(moveX, moveZ);
		}

		if (this.isMoving) {

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
			this.headGroup.position.y = 2.55 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.05;
		} else {
			// Idle - return to neutral pose smoothly
			this.walkCycle = 0;
			this.leftArmPivot.rotation.x *= 0.85;
			this.rightArmPivot.rotation.x *= 0.85;
			this.leftLegPivot.rotation.x *= 0.85;
			this.rightLegPivot.rotation.x *= 0.85;

			this.torso.position.y = 1.5;
			this.headGroup.position.y = 2.55;
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

		// T141: Update chat bubble timer (5 seconds duration)
		if (this.chatSprite.visible) {
			this.chatTimer += deltaTime;
			if (this.chatTimer >= this.chatDuration) {
				this.chatSprite.visible = false;
			}
		}

		// FR-019: Update typing indicator animation
		if (this.typingSprite.visible) {
			// Animate dots at 2Hz (phase cycles 0 -> 1 every 0.5 seconds)
			this.typingAnimationPhase = (this.typingAnimationPhase + deltaTime * 2) % 1;
			this.renderTypingIndicator();
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
