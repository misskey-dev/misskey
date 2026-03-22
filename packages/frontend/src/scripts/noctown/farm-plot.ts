import * as THREE from 'three';

export class FarmPlot {
	public x: number;
	public z: number;
	public state: 'empty' | 'seeded' | 'growing' | 'ready';
	public crop: null; // 将来実装
	public growthTimer: number; // 将来実装
	public growthTarget: number; // 将来実装
	public group: THREE.Group;
	public soil: THREE.Mesh;
	public plant: THREE.Group;

	constructor(x: number, z: number) {
		this.x = x;
		this.z = z;
		this.state = 'empty';
		this.crop = null;
		this.growthTimer = 0;
		this.growthTarget = 0;
		this.group = new THREE.Group();
		this.group.position.set(x, 0, z);

		// ダミー初期化（createPlot()で実際のメッシュを作成）
		this.soil = new THREE.Mesh();
		this.plant = new THREE.Group();

		this.createPlot();
	}

	private createPlot(): void {
		// 土台
		const soilGeo = new THREE.BoxGeometry(2, 0.2, 2);
		const soilMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
		this.soil = new THREE.Mesh(soilGeo, soilMat);
		this.soil.position.y = 0.1;
		this.soil.castShadow = true;
		this.soil.receiveShadow = true;
		this.group.add(this.soil);

		// 畝（4本のBoxGeometry）
		const lineGeo = new THREE.BoxGeometry(1.8, 0.15, 0.1);
		const lineMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
		const linePositions = [-0.6, -0.2, 0.2, 0.6];
		for (const zPos of linePositions) {
			const line = new THREE.Mesh(lineGeo, lineMat);
			line.position.set(0, 0.18, zPos);
			line.castShadow = true;
			line.receiveShadow = true;
			this.group.add(line);
		}

		// 植物ホルダー（初期非表示）
		this.plant = new THREE.Group();
		this.plant.position.y = 0.2;
		this.plant.visible = false;
		this.group.add(this.plant);
	}

	public isNear(playerPos: { x: number; z: number }, range: number = 2): boolean {
		const dx = playerPos.x - this.x;
		const dz = playerPos.z - this.z;
		return Math.sqrt(dx * dx + dz * dz) < range;
	}
}

export function createFarmPlotMesh(x: number, z: number): FarmPlot {
	return new FarmPlot(x, z);
}
