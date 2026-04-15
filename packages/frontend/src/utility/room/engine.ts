/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/*
 * Roomで使われるオブジェクトの仕様
 * - Blenderで設計すること。必ず.blendファイルも含めること。
 * - 単位はセンチメートルで設計すること。
 * - それを置いたときに底になる縦軸座標(blenderならz)が0になるように設計すること。
 * - BlenderならYがマイナスになる方向が手前。(=スザンヌを設置してデフォルトで顔が向いている方向が手前)
 * - 壁面設置の場合は壁面に接する面のY軸座標が0になるように設計すること。
 * - ポリゴン数は、極端にハイポリでない限りはパフォーマンスに影響を及ぼすことは少ないです(必要ドローコール数の多寡の方が重要)。とはいえ、モデリングのし易さ・見た目の統一感を考えると(極端に見た目が不自然にならない程度に)低ポリゴンを推奨します。
 *   目安として、例えば円柱を考えると、直径20cm程度以下なら頂点数16、直径2cm程度以下なら頂点数8、0.5cm程度以下なら頂点数4程度を推奨します。(2の乗数を推奨) なおここでいう頂点数とは、メッシュ全体の頂点数ではなく、円柱を作成するときのオプション項目にある"Vertices"の値のことです。
 *   具体例を挙げると、大きめの円形の壁掛け時計であれば32、コップであれば16、ストローであれば4~8 です。
 *   イメージとしてはPS2とか3DSくらいのポリゴン感です。Misskey Roomは3DCG作品ではなくゲームなので、多少のローポリ感はあってもいいです。
 * - メッシュ名を __TOP__ で始めると、その面の上にモノを置けることを示す。当該メッシュはレンダリングでは表示されません。
 * - メッシュ名を __SIDE__ で始めると、その面にモノを貼り付けられることを示す。当該メッシュはレンダリングでは表示されません。
 * - なお、現状 __TOP__ / __SIDE__ メッシュは単一の面でなければなりません。つまりArray Modifierなどを適用した状態では正しく動作しません。
 * - メッシュ名を __COLLISION__ で始めると、コリジョン用メッシュとして扱われます。当該メッシュはレンダリングでは表示されません。
 * - メッシュ名を __PICK__ で始めると、レイのヒットチェック用メッシュとして扱われます。当該メッシュはレンダリングでは表示されません。
 * - __PICK__が無い場合、すべてのメッシュをヒットチェックメッシュとして扱いますが、例えば網目のようなメッシュではレイが隙間を通り抜けて後ろにあるオブジェクトにヒットしてしまうなどの問題が発生します。
 * - シェイプキーを使用する場合、normalのエクスポートが有効だと面のレンダリングがおかしくなる場合があります。その場合は無効化してください。
 * - 後からモデルを調整したくなった時に備え、モディファイアを駆使するなどして、なるべく非破壊的なモデリングを心がけることを推奨します。
 * - パーツ的に分かれていることが自然なメッシュについても、できるだけマージせす、別々のメッシュのままにしてください。
 * - モディファイアをapplyしないとならないシチュエーションでは、apply前の状態を複製して(非表示にした上で)残すことを推奨します。
 * - 上記の非破壊的なモデリングの原則に反しない限り、なるべくscaleはapplyした状態で(=scaleが1, 1, 1の状態で)エクスポートすること。そうしないとbake前後で法線が変わるのかレンダリング結果が異なる現象が発生することがあります。
 * - 位置や回転についてはapplyする必要はありません。むしろなるべくしないでください。
 * - 現在のMisskey RoomのGLB root除去システムの実装上、スケールに1以外の値を持つメッシュにシェイプキーを設定することはサポートされていません。
 * - マテリアルは基本的にPrincipled BSDFを使ってください。
 * - メッシュ名やマテリアル名などは英語であると嬉しいです。
 */

// TODO: 家具設置時のコリジョン判定(めりこんで設置されないようにする)
// TODO: 近くのオブジェクトの端にスナップオプション
// TODO: 近くのオブジェクトの原点に軸を揃えるオプション

import * as BABYLON from '@babylonjs/core';
import { AxesViewer } from '@babylonjs/core/Debug/axesViewer';
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic';
import { BoundingBoxRenderer } from '@babylonjs/core/Rendering/boundingBoxRenderer';
import { GridMaterial } from '@babylonjs/materials';
import { EventEmitter } from 'eventemitter3';
import { genId } from '../id.js';
import { deepClone } from '../clone.js';
import { getObjectDef } from './object-defs.js';
import { HorizontalCameraKeyboardMoveInput, applyMorphTargetsToMesh, camelToKebab, cm, findMaterial, scaleMorph } from './utility.js';

const BAKE_TRANSFORM = false; // 実験的
const SNAPSHOT_RENDERING = false; // 実験的
const SNAPSHOT_RENDERING_NON_SUPPORTED_OBJECTS = ['tv', 'aquarium', 'lavaLamp'];
const IGNORE_OBJECTS: string[] = []; // for debug
const SYSTEM_MESH_NAMES = ['__TOP__', '__SIDE__', '__PICK__', '__COLLISION__', '__COLLISION_AUTO_GENERATED_INTERNALY__'];
const USE_GLOW = true; // ドローコールが増えて重い
const IN_WEB_WORKER = typeof window === 'undefined';

const TIME_MAP = {
	0: 2,
	1: 2,
	2: 2,
	3: 2,
	4: 2,
	5: 1,
	6: 1,
	7: 0,
	8: 0,
	9: 0,
	10: 0,
	11: 0,
	12: 0,
	13: 0,
	14: 0,
	15: 0,
	16: 1,
	17: 1,
	18: 2,
	19: 2,
	20: 2,
	21: 2,
	22: 2,
	23: 2,
} as const;

// babylonのドメイン知識は持たない
export type RoomStateObject<Options = any> = {
	id: string;
	type: string;
	position: [number, number, number];
	rotation: [number, number, number];
	options: Options;

	/**
	 * 別のオブジェクトのID
	 */
	sticky?: string | null;
};

type SimpleHeyaWallBase = {
	material: null | 'wood' | 'concrete';
	color: [number, number, number];
};

type Heya = {
	type: 'simple';
	options: {
		dimension: [number, number];
		window: 'none' | 'kosidakamado' | 'demado' | 'hakidasimado';
		wallN: SimpleHeyaWallBase;
		wallE: SimpleHeyaWallBase;
		wallS: SimpleHeyaWallBase;
		wallW: SimpleHeyaWallBase;
		flooring: {
			material: null | 'wood' | 'concrete';
			color: [number, number, number];
		};
		ceiling: {
			material: null | 'wood' | 'concrete';
			color: [number, number, number];
		};
	};
} | {
	type: 'japanese';
};

export type RoomState = {
	heya: Heya;
	installedObjects: RoomStateObject<any>[];
};

type RoomObjectInstance<Options> = {
	onInited?: () => void;
	onOptionsUpdated?: <K extends keyof Options, V extends Options[K]>(kv: [K, V]) => void;
	interactions: Record<string, {
		label: string;
		fn: () => void;
	}>;
	primaryInteraction?: string | null;
	resetTemporaryState?: () => void;
	dispose?: () => void;
};

export const WORLD_SCALE = 100;

type NumberOptionSchema = {
	type: 'number';
	label: string;
	min?: number;
	max?: number;
	step?: number;
};

type BooleanOptionSchema = {
	type: 'boolean';
	label: string;
};

type ColorOptionSchema = {
	type: 'color';
	label: string;
};

type EnumOptionSchema = {
	type: 'enum';
	label: string;
	enum: string[];
};

type RangeOptionSchema = {
	type: 'range';
	label: string;
	min: number;
	max: number;
	step?: number;
};

type ImageOptionSchema = {
	type: 'image';
	label: string;
};

type OptionsSchema = Record<string, NumberOptionSchema | BooleanOptionSchema | ColorOptionSchema | EnumOptionSchema | RangeOptionSchema | ImageOptionSchema>;

type GetOptionsSchemaValues<T extends OptionsSchema> = {
	[K in keyof T]:
	T[K] extends NumberOptionSchema ? number :
	T[K] extends BooleanOptionSchema ? boolean :
	T[K] extends ColorOptionSchema ? [number, number, number] :
	T[K] extends EnumOptionSchema ? T[K]['enum'][number] :
	T[K] extends RangeOptionSchema ? number :
	T[K] extends ImageOptionSchema ? string | null :
	never;
};

class ModelManager {
	public root: BABYLON.Mesh;
	public bakedCallback: (() => void) | null = null;
	public bakeExcludeMeshes: BABYLON.Mesh[] = [];
	private originalMeshes: BABYLON.Mesh[] = [];
	private bakedMeshes: BABYLON.Mesh[] = [];

	constructor(root: BABYLON.Mesh, originalMeshes: BABYLON.Mesh[], bakedCallback: (() => void) | null = null) {
		this.root = root;
		this.originalMeshes = originalMeshes;
		this.bakedCallback = bakedCallback;
	}

	public findMesh(keyword: string) {
		const mesh = this.root.getChildMeshes().find(m => m.name.includes(keyword));
		if (mesh == null) {
			throw new Error(`Mesh with keyword "${keyword}" not found for object ${this.root.metadata?.objectType}`);
		}
		return mesh as BABYLON.Mesh;
	}

	public findMeshes(keyword: string) {
		const meshes = this.root.getChildMeshes().filter(m => m.name.includes(keyword));
		return meshes as BABYLON.Mesh[];
	}

	public findMaterial(keyword: string) {
		return findMaterial(this.root, keyword);
	}

	public findTransformNode(keyword: string) {
		const node = this.root.getChildTransformNodes().find(n => n.name.includes(keyword));
		if (node == null) {
			throw new Error(`TransformNode with keyword "${keyword}" not found for object ${this.root.metadata?.objectType}`);
		}
		return node;
	}

	public updated() {
	}

	public bakeMesh() {
		for (const m of this.bakedMeshes) {
			m.dispose();
		}
		this.bakedMeshes = [];

		const excludeMeshes = [...this.bakeExcludeMeshes, ...this.root.getChildMeshes().filter(m => SYSTEM_MESH_NAMES.some(s => m.name.includes(s)))];

		const childMeshes = this.root.getChildMeshes().filter(m => !excludeMeshes.some(x => x === m) && m.isVisible);

		const _toMerge = [] as BABYLON.Mesh[];
		for (const mesh of childMeshes) {
			let fixedMesh = mesh;
			fixedMesh.setEnabled(false);

			if (mesh instanceof BABYLON.InstancedMesh) {
				const sourceMesh = mesh.sourceMesh;
				const realizedMesh = sourceMesh.clone(mesh.name + '_realized', null, true);
				realizedMesh.getScene().removeMesh(realizedMesh);

				realizedMesh.position = mesh.position.clone();
				if (mesh.rotationQuaternion) {
					realizedMesh.rotationQuaternion = mesh.rotationQuaternion.clone();
				} else {
					realizedMesh.rotation = mesh.rotation.clone();
				}
				realizedMesh.scaling = mesh.scaling.clone();
				realizedMesh.parent = mesh.parent;
				realizedMesh.setEnabled(false);

				fixedMesh = realizedMesh;
			}

			_toMerge.push(fixedMesh);
		}

		const toMerge = [] as BABYLON.Mesh[];
		for (const mesh of _toMerge) {
			const newMesh = mesh.name.endsWith('_realized') ? mesh : mesh.clone(mesh.name + '_bakeMerged', null, true);
			newMesh.makeGeometryUnique();
			applyMorphTargetsToMesh(newMesh);
			if (newMesh.parent === this.root) {
				newMesh.parent = null;
			} else {
				newMesh.setParent(this.root);
				//newMesh.bakeCurrentTransformIntoVertices();
				newMesh.parent = null;
			}
			//newMesh.bakeCurrentTransformIntoVertices();

			// TODO: 必要な時だけやる
			if (newMesh.getVerticesData(BABYLON.VertexBuffer.UVKind) == null) {
				const vertexCount = newMesh.getTotalVertices();
				const uvs = new Array(vertexCount * 2).fill(0);
				newMesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs, false, 2);
			}
			if (newMesh.getVerticesData(BABYLON.VertexBuffer.UV2Kind) == null) {
				const vertexCount = newMesh.getTotalVertices();
				const uvs = new Array(vertexCount * 2).fill(0);
				newMesh.setVerticesData(BABYLON.VertexBuffer.UV2Kind, uvs, false, 2);
			}

			toMerge.push(newMesh);
		}

		const merged = BABYLON.Mesh.MergeMeshes(toMerge, true, true, undefined, false, true);
		merged.parent = this.root;
		merged.material.freeze();
		if (merged.material instanceof BABYLON.MultiMaterial) {
			for (const subMat of merged.material.subMaterials) {
				(subMat as BABYLON.PBRMaterial).freeze();
			}
		}
		merged.freezeWorldMatrix();
		merged.metadata = { ...this.root.metadata };
		this.bakedMeshes = [merged];

		this.bakedCallback?.([...this.bakedMeshes, ...excludeMeshes]);
	}

	public unbakeMesh() {
		for (const m of this.bakedMeshes) {
			m.dispose();
		}
		this.bakedMeshes = [];

		const childMeshes = this.root.getChildMeshes();

		for (const mesh of childMeshes) {
			mesh.setEnabled(true);
		}

		this.bakedCallback?.(this.root.getChildMeshes());
	}
}

export type ObjectDef<OpSc extends OptionsSchema = OptionsSchema> = {
	id: string;
	name: string;
	path?: string;
	options: {
		schema: OpSc;
		default: GetOptionsSchemaValues<OpSc>;
	};
	placement: 'top' | 'side' | 'bottom' | 'wall' | 'ceiling' | 'floor';
	hasCollisions?: boolean;
	//groupingMeshes: string[]; // multi-materialなメッシュは複数のメッシュに分割されるが、それだと不便な場合に追加の親メッシュでグルーピングするための指定
	isChair?: boolean;
	treatLoaderResult?: (loaderResult: BABYLON.AssetContainer) => void;
	createInstance: (args: {
		room?: RoomEngine | null;
		scene: BABYLON.Scene;
		root: BABYLON.Mesh;
		options: Readonly<GetOptionsSchemaValues<OpSc>>;
		model: ModelManager;
		id: string;
		stickyMarkerMeshUpdated?: (mesh: BABYLON.Mesh) => void;
	}) => RoomObjectInstance<GetOptionsSchemaValues<OpSc>> | Promise<RoomObjectInstance<GetOptionsSchemaValues<OpSc>>>; // TODO: createInstanceをasyncにするのではなく、別にreadyみたいなものを返させる
};

export function defineObject<const OpSc extends OptionsSchema>(def: ObjectDef<OpSc>): ObjectDef<OpSc> {
	return def;
}

export function defineObjectClass<const OpSc extends OptionsSchema>(baseDef: Partial<ObjectDef<OpSc>>): {
	extend: (childDef: Partial<ObjectDef<OpSc>>) => ObjectDef<OpSc>;
} {
	return {
		extend: (childDef) => ({ ...baseDef, ...childDef }) as ObjectDef<OpSc>,
	};
}

// この実装方法だとマイナスの座標をうまく処理できず結果がおかしくなるので応急処置で全体を+10000cmオフセットしてから計算している
function getMeshesBoundingBox(meshes: BABYLON.Mesh[]): BABYLON.BoundingBox {
	let min = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
	let max = new BABYLON.Vector3(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);

	for (const mesh of meshes) {
		const boundingInfo = mesh.getBoundingInfo();
		min = BABYLON.Vector3.Minimize(min, boundingInfo.boundingBox.minimumWorld.add(new BABYLON.Vector3(10000, 10000, 10000)));
		max = BABYLON.Vector3.Maximize(max, boundingInfo.boundingBox.maximumWorld.add(new BABYLON.Vector3(10000, 10000, 10000)));
	}

	return new BABYLON.BoundingBox(min.subtract(new BABYLON.Vector3(10000, 10000, 10000)), max.subtract(new BABYLON.Vector3(10000, 10000, 10000)));
}

function enableObjectCollision(meshes: BABYLON.Mesh[]) {
	for (const mesh of meshes) {
		if (mesh.name.includes('__COLLISION__')) {
			mesh.checkCollisions = true;
			//mesh.isVisible = true; // debug
		} else {
			mesh.checkCollisions = false;
		}
	}
}

export type RoomEngineEvents = {
	'changeSelectedState': (ctx: {
		selected: {
			objectId: string;
			objectState: RoomStateObject<any>;
			objectDef: ObjectDef<any>;
		} | null;
	}) => void;
	'changeGrabbingState': (ctx: { grabbing: { forInstall: boolean } | null }) => void;
	'changeEditMode': (ctx: { isEditMode: boolean }) => void;
	'changeGridSnapping': (ctx: { gridSnapping: { enabled: boolean; scale: number } }) => void;
	'changeRoomState': (ctx: { roomState: RoomState }) => void;
	'playSfxUrl': (ctx: {
		url: string;
		options: {
			volume: number;
			playbackRate: number;
		};
	}) => void;
};

export class RoomEngine extends EventEmitter<RoomEngineEvents> {
	private canvas: HTMLCanvasElement;
	private engine: BABYLON.WebGPUEngine;
	public scene: BABYLON.Scene;
	private shadowGeneratorForRoomLight: BABYLON.ShadowGenerator;
	private shadowGeneratorForSunLight: BABYLON.ShadowGenerator;
	public camera: BABYLON.UniversalCamera;
	private fixedCamera: BABYLON.UniversalCamera;
	private birdeyeCamera: BABYLON.ArcRotateCamera;
	public intervalIds: number[] = [];
	public timeoutIds: number[] = [];
	public objectEntities: Map<string, {
		rootMesh: BABYLON.Mesh;
		instance: RoomObjectInstance<any>;
		model: ModelManager;
	}> = new Map();

	// TODO: たぶんオブジェクト内の値のmutateはsetで検知できないので、そのような操作を実際に行うようになった & それを検知する必要性が出てきたら専用の設定関数などを新設してそれを使わせる
	private _grabbingCtx: {
		objectId: string;
		objectType: string;
		forInstall: boolean;
		mesh: BABYLON.TransformNode;
		originalDiffOfPosition: BABYLON.Vector3;
		originalDiffOfRotationY: number;
		distance: number;
		rotation: number;
		ghost: BABYLON.AbstractMesh;
		descendantStickyObjectIds: string[];
		onMove?: (info: { position: BABYLON.Vector3; rotation: BABYLON.Vector3; sticky: string | null; }) => void;
		onCancel?: () => void;
		onDone?: () => void;
	} | null = null;
	get grabbingCtx() {
		return this._grabbingCtx;
	}
	set grabbingCtx(v) {
		this._grabbingCtx = v;
		this.emit('changeGrabbingState', { grabbing: v == null ? null : { forInstall: v.forInstall } });
	}

	// TODO: たぶんオブジェクト内の値のmutateはsetで検知できないので、そのような操作を実際に行うようになった & それを検知する必要性が出てきたら専用の設定関数などを新設してそれを使わせる
	private _selected: {
		objectId: string;
		objectEntity: RoomEngine['objectEntities'] extends Map<string, infer V> ? V : never;
		objectState: RoomStateObject<any>;
		objectDef: ObjectDef;
	} | null = null;
	get selected() {
		return this._selected;
	}
	set selected(v) {
		this._selected = v;
		this.emit('changeSelectedState', { selected: v == null ? null : { objectId: v.objectId, objectState: v.objectState, objectDef: v.objectDef } });
	}

	private time: 0 | 1 | 2 = 0; // 0: 昼, 1: 夕, 2: 夜
	private roomCollisionMeshes: BABYLON.AbstractMesh[] = [];
	public roomState: RoomState;

	private _gridSnapping = { enabled: true, scale: cm(4) };
	get gridSnapping() {
		return this._gridSnapping;
	}
	set gridSnapping(v) {
		this._gridSnapping = v;
		this.emit('changeGridSnapping', { gridSnapping: v });
	}

	private putParticleSystem: BABYLON.ParticleSystem;
	private envMapIndoor: BABYLON.CubeTexture;
	private envMapOutdoor: BABYLON.CubeTexture;
	private roomLight: BABYLON.SpotLight;
	public lightContainer: BABYLON.ClusteredLightContainer;
	private xGridPreviewPlane: BABYLON.Mesh;
	private yGridPreviewPlane: BABYLON.Mesh;
	private zGridPreviewPlane: BABYLON.Mesh;
	private selectionOutlineLayer: BABYLON.SelectionOutlineLayer;
	public sr: BABYLON.SnapshotRenderingHelper;

	private _isEditMode = false;
	get isEditMode() {
		return this._isEditMode;
	}
	set isEditMode(v) {
		this._isEditMode = v;
		this.emit('changeEditMode', { isEditMode: v });
	}

	public isSitting = false;
	private fps: number | null = 30;
	private disposed = false;

	public domEvents: EventEmitter<{
		'click': (event: { offsetX: number; offsetY: number; }) => void;
		'keydown': (event: { code: string; shiftKey: boolean; }) => void;
		'keyup': (event: { code: string; shiftKey: boolean; }) => void;
		'wheel': (event: { deltaY: number; }) => void;
	}> = new EventEmitter();

	constructor(roomState: RoomState, options: {
		canvas: HTMLCanvasElement;
		engine: BABYLON.WebGPUEngine;
	}) {
		super();

		this.roomState = {
			...JSON.parse(JSON.stringify(roomState)),
			installedObjects: roomState.installedObjects.map(o => ({
				...o,
				options: { ...getObjectDef(o.type).options.default, ...o.options },
			})),
		};
		this.canvas = options.canvas;

		registerBuiltInLoaders();

		this.engine = options.engine;
		this.scene = new BABYLON.Scene(this.engine);
		this.scene.autoClear = false;
		//this.scene.autoClearDepthAndStencil = false;
		this.scene.skipPointerMovePicking = true;

		this.sr = new BABYLON.SnapshotRenderingHelper(this.scene);

		const skybox = BABYLON.MeshBuilder.CreateBox('skybox', { size: cm(100000) }, this.scene);
		const skyboxMat = new BABYLON.StandardMaterial('skyboxMat', this.scene);
		skyboxMat.backFaceCulling = false;
		skyboxMat.disableLighting = true;
		skybox.material = skyboxMat;
		skybox.infiniteDistance = true;

		this.time = TIME_MAP[new Date().getHours() as keyof typeof TIME_MAP];

		if (this.time === 0) {
			skyboxMat.emissiveColor = new BABYLON.Color3(0.7, 0.9, 1.0);
		} else if (this.time === 1) {
			skyboxMat.emissiveColor = new BABYLON.Color3(0.8, 0.5, 0.3);
		} else {
			skyboxMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.2);
		}
		this.scene.ambientColor = new BABYLON.Color3(1.0, 0.9, 0.8);

		this.envMapIndoor = BABYLON.CubeTexture.CreateFromPrefilteredData('/client-assets/room/indoor.env', this.scene);
		this.envMapIndoor.boundingBoxSize = new BABYLON.Vector3(cm(500), cm(500), cm(500));

		this.envMapOutdoor = BABYLON.CubeTexture.CreateFromPrefilteredData(this.time === 2 ? '/client-assets/room/outdoor-night.env' : '/client-assets/room/outdoor-day.env', this.scene);
		this.envMapOutdoor.level = this.time === 0 ? 0.5 : this.time === 1 ? 0.3 : 0.1;

		this.scene.collisionsEnabled = true;

		this.camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, cm(130), cm(0)), this.scene);
		this.camera.inputs.removeByType('FreeCameraKeyboardMoveInput');
		this.camera.inputs.add(new HorizontalCameraKeyboardMoveInput(this.camera, this.fps));
		this.camera.attachControl(this.canvas);
		this.camera.minZ = cm(1);
		this.camera.maxZ = cm(100000);
		this.camera.fov = 1;
		this.camera.ellipsoid = new BABYLON.Vector3(cm(15), cm(65), cm(15));
		this.camera.checkCollisions = true;
		this.camera.applyGravity = true;
		this.camera.needMoveForGravity = true;

		//this.scene.activeCamera = this.camera;

		const ambientLight = new BABYLON.HemisphericLight('ambientLight', new BABYLON.Vector3(0, 1, -0.5), this.scene);
		ambientLight.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
		ambientLight.intensity = 0.5;
		//ambientLight.intensity = 0;

		this.roomLight = new BABYLON.SpotLight('roomLight', new BABYLON.Vector3(0, cm(249), 0), new BABYLON.Vector3(0, -1, 0), 16, 8, this.scene);
		this.roomLight.diffuse = new BABYLON.Color3(1.0, 0.9, 0.8);
		this.roomLight.shadowMinZ = cm(10);
		this.roomLight.shadowMaxZ = cm(300);

		this.shadowGeneratorForRoomLight = new BABYLON.ShadowGenerator(2048, this.roomLight);
		this.shadowGeneratorForRoomLight.forceBackFacesOnly = true;
		this.shadowGeneratorForRoomLight.bias = 0.0001;
		this.shadowGeneratorForRoomLight.usePercentageCloserFiltering = true;
		this.shadowGeneratorForRoomLight.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
		if (!SNAPSHOT_RENDERING) this.shadowGeneratorForRoomLight.getShadowMap().refreshRate = 60; // snapshot renderingではrefreshRateが設定されているとなぜかクラッシュする
		//this.shadowGenerator1.useContactHardeningShadow = true;

		const sunLight = new BABYLON.DirectionalLight('sunLight', new BABYLON.Vector3(0.2, -1, -1), this.scene);
		sunLight.position = new BABYLON.Vector3(cm(-20), cm(1000), cm(1000));
		sunLight.diffuse = this.time === 0 ? new BABYLON.Color3(1.0, 0.9, 0.8) : this.time === 1 ? new BABYLON.Color3(1.0, 0.8, 0.6) : new BABYLON.Color3(0.6, 0.8, 1.0);
		sunLight.intensity = this.time === 0 ? 3 : this.time === 1 ? 1 : 0.25;
		sunLight.shadowMinZ = cm(1000);
		sunLight.shadowMaxZ = cm(2000);

		this.shadowGeneratorForSunLight = new BABYLON.ShadowGenerator(2048, sunLight);
		this.shadowGeneratorForSunLight.forceBackFacesOnly = true;
		this.shadowGeneratorForSunLight.bias = 0.0001;
		this.shadowGeneratorForSunLight.usePercentageCloserFiltering = true;
		this.shadowGeneratorForSunLight.usePoissonSampling = true;
		if (!SNAPSHOT_RENDERING) this.shadowGeneratorForSunLight.getShadowMap().refreshRate = 60; // snapshot renderingではrefreshRateが設定されているとなぜかクラッシュする

		this.lightContainer = new BABYLON.ClusteredLightContainer('clustered', [], this.scene);

		this.turnOnRoomLight();

		if (USE_GLOW) {
			const gl = new BABYLON.GlowLayer('glow', this.scene, {
				//mainTextureFixedSize: 512,
				blurKernelSize: 64,
			});
			gl.intensity = 0.5;

			if (SNAPSHOT_RENDERING) {
				this.sr.updateMeshesForEffectLayer(gl);
			}
		}

		{
			//const postProcess = new BABYLON.ImageProcessingPostProcess('processing', 1.0, this.camera);
			//postProcess.exposure = 1.1;
			//postProcess.contrast = 0.9;

			//const curve = new BABYLON.ColorCurves();
			//curve.highlightsHue = 40;
			//curve.highlightsDensity = 50;
			//curve.highlightsSaturation = 40;
			//curve.shadowsHue = 200;
			//curve.shadowsDensity = 100;
			//curve.shadowsSaturation = 40;
			//postProcess.colorCurvesEnabled = true;
			//postProcess.colorCurves = curve;

			//const postProcess2 = new BABYLON.ImageProcessingPostProcess('processing2', 1.0, this.birdeyeCamera);
			//postProcess2.exposure = 2;
			//postProcess2.contrast = 0.9;

			//const ssao = new BABYLON.SSAORenderingPipeline('ssao', this.scene, {
			//	ssaoRatio: 4,
			//	combineRatio: 1,
			//});
			//ssao.radius = 0.0001;
			//ssao.totalStrength = 0.8;
			//this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline('ssao', this.camera);

			//const lensEffect = new BABYLON.LensRenderingPipeline('lens', {
			//	edge_blur: 1.0,
			//	distortion: 0.5,
			//	dof_focus_distance: cm(90),
			//	dof_aperture: 6.0,
			//	dof_pentagon: true,
			//	dof_gain: 2.0,
			//	dof_threshold: 1.0,
			//	dof_darken: 0,
			//}, this.scene, 1, [this.camera]);
		}

		this.putParticleSystem = new BABYLON.ParticleSystem('', 64, this.scene);
		this.putParticleSystem.particleTexture = new BABYLON.Texture('/client-assets/room/steam.png');
		this.putParticleSystem.createCylinderEmitter(cm(5), cm(1), cm(5));
		this.putParticleSystem.minEmitBox = new BABYLON.Vector3(cm(-3), 0, cm(-3));
		this.putParticleSystem.maxEmitBox = new BABYLON.Vector3(cm(3), 0, cm(3));
		this.putParticleSystem.minEmitPower = 700;
		this.putParticleSystem.maxEmitPower = 1000;
		this.putParticleSystem.addVelocityGradient(0, 1);
		this.putParticleSystem.addVelocityGradient(1, 0);
		this.putParticleSystem.minLifeTime = 0.2;
		this.putParticleSystem.maxLifeTime = 0.2;
		this.putParticleSystem.minSize = cm(1);
		this.putParticleSystem.maxSize = cm(4);
		this.putParticleSystem.emitRate = 256;
		this.putParticleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
		this.putParticleSystem.color1 = new BABYLON.Color4(1, 1, 1, 0.3);
		this.putParticleSystem.color2 = new BABYLON.Color4(1, 1, 1, 0.2);
		this.putParticleSystem.colorDead = new BABYLON.Color4(1, 1, 1, 0);
		this.putParticleSystem.targetStopDuration = 0.05;

		const gridMaterial = new GridMaterial('grid', this.scene);
		gridMaterial.lineColor = new BABYLON.Color3(0.5, 0.5, 0.5);
		gridMaterial.mainColor = new BABYLON.Color3(0, 0, 0);
		gridMaterial.minorUnitVisibility = 1;
		gridMaterial.opacity = 0.5;
		// todo
		//watch(this.gridSnappingScale, (v) => {
		//	gridMaterial.gridRatio = v;
		//}, { immediate: true });

		this.xGridPreviewPlane = BABYLON.MeshBuilder.CreatePlane('xGridPreviewPlane', { width: cm(1000), height: cm(1000) }, this.scene);
		this.xGridPreviewPlane.rotation = new BABYLON.Vector3(0, 0, Math.PI / 2);
		this.xGridPreviewPlane.material = gridMaterial;
		this.xGridPreviewPlane.isPickable = false;
		this.xGridPreviewPlane.isVisible = false;

		this.yGridPreviewPlane = BABYLON.MeshBuilder.CreatePlane('yGridPreviewPlane', { width: cm(1000), height: cm(1000) }, this.scene);
		this.yGridPreviewPlane.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
		this.yGridPreviewPlane.material = gridMaterial;
		this.yGridPreviewPlane.isPickable = false;
		this.yGridPreviewPlane.isVisible = false;

		this.zGridPreviewPlane = BABYLON.MeshBuilder.CreatePlane('zGridPreviewPlane', { width: cm(1000), height: cm(1000) }, this.scene);
		this.zGridPreviewPlane.material = gridMaterial;
		this.zGridPreviewPlane.isPickable = false;
		this.zGridPreviewPlane.isVisible = false;

		this.selectionOutlineLayer = new BABYLON.SelectionOutlineLayer('outliner', this.scene);

		if (_DEV_) {
			// snapshot renderingかつglow layerが有効だとなんかクラッシュする
			if (!(SNAPSHOT_RENDERING && USE_GLOW)) {
				const axes = new AxesViewer(this.scene, 30);
				axes.xAxis.position = new BABYLON.Vector3(0, 30, 0);
				axes.yAxis.position = new BABYLON.Vector3(0, 30, 0);
				axes.zAxis.position = new BABYLON.Vector3(0, 30, 0);
			}

			if (!IN_WEB_WORKER) {
				(window as any).showBabylonInspector = () => {
					import('@babylonjs/inspector').then(({ ShowInspector }) => {
						ShowInspector(this.scene);
					});
				};
			}
		}
	}

	public async init() {
		await this.loadRoomModel();
		//await this.loadEnvModel();
		await Promise.all(this.roomState.installedObjects.filter(o => !IGNORE_OBJECTS.includes(o.type) && (!SNAPSHOT_RENDERING || !SNAPSHOT_RENDERING_NON_SUPPORTED_OBJECTS.includes(o.type))).map(o => this.loadObject({
			id: o.id,
			type: o.type,
			position: new BABYLON.Vector3(...o.position),
			rotation: new BABYLON.Vector3(o.rotation[0], o.rotation[1], o.rotation[2]),
			options: o.options,
		})));

		//const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: cm(1) }, this.scene);

		if (this.fps == null) {
			this.engine.runRenderLoop(() => {
				this.scene.render();
			});
		} else {
			let then = 0;
			const interval = 1000 / this.fps;

			const renderLoop = (timeStamp: number) => {
				if (this.disposed) return;

				window.requestAnimationFrame(renderLoop);

				const delta = timeStamp - then;
				if (delta <= interval) return;
				then = timeStamp - (delta % interval);

				this.engine.beginFrame();
				this.scene.render();
				this.engine.endFrame();
			};

			window.requestAnimationFrame(renderLoop);
		}

		if (SNAPSHOT_RENDERING) {
			window.setTimeout(() => {
				this.sr.enableSnapshotRendering();
			}, 3000);
		}

		this.domEvents.on('keydown', (ev) => {
			if (ev.code === 'KeyE') {
				if (this.isEditMode) {
					if (this.grabbingCtx != null) {
						this.endGrabbing();
					} else {
						this.beginSelectedInstalledObjectGrabbing();
					}
				} else if (this.selected != null) {
					this.interact(this.selected.objectId);
				}
			} else if (ev.code === 'KeyR') {
				if (this.grabbingCtx != null) {
					this.changeGrabbingRotationY(Math.PI / 8);
				}
			} else if (ev.code === 'KeyQ') {
				if (this.isSitting) {
					this.standUp();
				}
			} else if (ev.code === 'Tab') {
				if (this.isEditMode) {
					this.exitEditMode();
				} else {
					this.enterEditMode();
				}
			}
		});

		this.domEvents.on('wheel', (ev) => {
			if (this.grabbingCtx != null) {
				this.changeGrabbingDistance(ev.deltaY * 0.025);
			} else {
				this.camera.fov += ev.deltaY * 0.001;
				this.camera.fov = Math.max(0.25, Math.min(1, this.camera.fov));
			}
		});

		this.domEvents.on('click', (ev) => {
			if (this.grabbingCtx != null) return;

			this.selectObject(null);

			// TODO: __PICK__考慮
			const pickingInfo = this.scene.pick(this.scene.pointerX, this.scene.pointerY,
				(m) => m.metadata?.objectId != null && this.objectEntities.has(m.metadata.objectId));

			if (pickingInfo.pickedMesh != null) {
				const oid = pickingInfo.pickedMesh.metadata.objectId;
				if (oid != null && this.objectEntities.has(oid)) {
					const o = this.objectEntities.get(oid)!;
					const boundingInfo = getMeshesBoundingBox(o.rootMesh.getChildMeshes().filter(m => m.isEnabled() && m.isVisible));
					this.selectObject(oid);

					{ // camera animation
						const animTarget = new BABYLON.Animation(
							'',
							'target',
							60,
							BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
							BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
						);
						const keys = [
							{ frame: 0, value: this.camera.target.clone() },
							{ frame: 30, value: boundingInfo.center.clone() },
						];
						animTarget.setKeys(keys);
						const easing = new BABYLON.CubicEase();
						easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
						animTarget.setEasingFunction(easing);
						this.camera.animations.push(animTarget);
						this.scene.beginAnimation(this.camera, 0, 30, false);
					}
				}
			}
		});
	}

	public selectObject(objectId: string | null) {
		const currentSelected = this.selected;
		if (currentSelected != null) {
			this.selected = null;
			this.clearHighlight();
			currentSelected.objectEntity.model.bakeMesh();
		}

		if (objectId != null) {
			const entity = this.objectEntities.get(objectId);
			if (entity != null) {
				entity.model.unbakeMesh();
				this.highlightMeshes(entity.rootMesh.getChildMeshes());
				const state = this.roomState.installedObjects.find(o => o.id === objectId)!;
				this.selected = {
					objectId,
					objectEntity: entity,
					objectState: state,
					objectDef: getObjectDef(state.type),
				};
			}
		}
	}

	private handleGrabbing() {
		if (this.grabbingCtx == null) return;
		const grabbing = this.grabbingCtx;

		const placement = getObjectDef(grabbing.objectType).placement;

		const dir = this.camera.getDirection(BABYLON.Axis.Z).scale(this.scene.useRightHandedSystem ? -1 : 1);
		const newPos = this.camera.position.add(dir.scale(grabbing.distance)).add(grabbing.originalDiffOfPosition);
		const newRotation = new BABYLON.Vector3(0, this.camera.rotation.y + grabbing.originalDiffOfRotationY + grabbing.rotation, 0);
		grabbing.ghost.position = newPos.clone();
		grabbing.ghost.rotation = newRotation.clone();

		if (this.gridSnapping.enabled) {
			newPos.x = Math.round(newPos.x / this.gridSnapping.scale) * this.gridSnapping.scale;
			newPos.y = Math.round(newPos.y / this.gridSnapping.scale) * this.gridSnapping.scale;
			newPos.z = Math.round(newPos.z / this.gridSnapping.scale) * this.gridSnapping.scale;
			newRotation.y = Math.round(newRotation.y / (Math.PI / 8)) * (Math.PI / 8);
		}

		let sticky: string | null = null;

		const isCollisionTarget = (m: BABYLON.AbstractMesh) => {
			return m.metadata?.objectId !== grabbing.objectId &&
				!m.metadata?.isGhost &&
				!grabbing.descendantStickyObjectIds.includes(m.metadata?.objectId);
		};

		if (placement === 'side') {
			// 前方に向かってレイを飛ばす
			const ray = new BABYLON.Ray(this.camera.position, dir, cm(1000));
			const hit = this.scene.pickWithRay(ray, (m) => isCollisionTarget(m) && (m.name.includes('__ROOM_WALL__') || m.name.includes('__SIDE__')));
			if (hit != null && hit.pickedPoint != null && hit.pickedMesh != null) {
				newPos.x = hit.pickedPoint.x;
				newPos.y = hit.pickedPoint.y;
				newPos.z = hit.pickedPoint.z;
				const pickedMeshNormal = hit.getNormal(true, true);
				const targetRotationY = Math.atan2(pickedMeshNormal.x, pickedMeshNormal.z);
				newRotation.y = targetRotationY;
				sticky = hit.pickedMesh.metadata?.objectId ?? null;
			}
		} else if (placement === 'wall') {
			// 前方に向かってレイを飛ばす
			const ray = new BABYLON.Ray(this.camera.position, dir, cm(1000));
			const hit = this.scene.pickWithRay(ray, (m) => isCollisionTarget(m) && (m.name.includes('__ROOM_WALL__')));
			if (hit != null && hit.pickedPoint != null && hit.pickedMesh != null) {
				newPos.x = hit.pickedPoint.x;
				newPos.y = hit.pickedPoint.y;
				newPos.z = hit.pickedPoint.z;
				const pickedMeshNormal = hit.getNormal(true, true);
				const targetRotationY = Math.atan2(pickedMeshNormal.x, pickedMeshNormal.z);
				newRotation.y = targetRotationY;
			}
		} else if (placement === 'bottom') {
			// 上に向かってレイを飛ばす
			const ray = new BABYLON.Ray(newPos, new BABYLON.Vector3(0, 1, 0), cm(1000));
			const hit = this.scene.pickWithRay(ray, (m) => isCollisionTarget(m) && (m.name.includes('__ROOM_CEILING__') || m.name.includes('__BOTTOM__')));
			if (hit != null && hit.pickedPoint != null && hit.pickedMesh != null) {
				newPos.y = hit.pickedPoint.y;
				sticky = hit.pickedMesh.metadata?.objectId ?? null;
			}
			if (newPos.y > cm(250)) newPos.y = cm(250);
		} else if (placement === 'ceiling') {
			newPos.y = cm(250);

			if (this.gridSnapping.enabled) {
				this.yGridPreviewPlane.position = new BABYLON.Vector3(grabbing.mesh.position.x, cm(250) - cm(0.1), grabbing.mesh.position.z);
				this.yGridPreviewPlane.isVisible = true;
			}
		} else if (placement === 'floor') {
			newPos.y = 0;

			if (this.gridSnapping.enabled) {
				this.yGridPreviewPlane.position = new BABYLON.Vector3(grabbing.mesh.position.x, cm(0.1), grabbing.mesh.position.z);
				this.yGridPreviewPlane.isVisible = true;
			}
		} else {
			// 下に向かってレイを飛ばす
			const ray = new BABYLON.Ray(newPos, new BABYLON.Vector3(0, -1, 0), cm(1000));
			const hit = this.scene.pickWithRay(ray, (m) => isCollisionTarget(m) && (m.name.includes('__ROOM_FLOOR__') || m.name.includes('__ROOM_TOP__') || m.name.includes('__TOP__')));
			if (hit != null && hit.pickedPoint != null && hit.pickedMesh != null) {
				newPos.y = hit.pickedPoint.y;
				sticky = hit.pickedMesh.metadata?.objectId ?? null;
			}
			if (newPos.y < 0) newPos.y = 0;

			if (this.gridSnapping.enabled) {
				this.yGridPreviewPlane.position = new BABYLON.Vector3(grabbing.mesh.position.x, grabbing.mesh.position.y + cm(0.1), grabbing.mesh.position.z);
				this.yGridPreviewPlane.isVisible = true;
			}
		}

		grabbing.mesh.rotation = newRotation;
		grabbing.mesh.position = newPos;

		//const pos = new BABYLON.Vector3(this.camera.position.x, this.camera.position.y, this.camera.position.z);
		//const _dir = newPos.subtract(pos).normalize();
		//for (let i = 0; i < grabbing.distance; i++) {
		//	// posを1cmずつnewPosの方向に動かす
		//	pos.addInPlace(_dir.scale(cm(1)));
		//	// 前方に向かってレイを飛ばして衝突チェック
		//	const ray = new BABYLON.Ray(this.camera.position, dir, i);
		//	const hit = this.scene.pickWithRay(ray, (m) => isCollisionTarget(m));
		//	if (hit != null && hit.pickedPoint != null && hit.pickedMesh != null) {
		//		//const isCollided = grabbing.mesh.intersectsMesh(hit.pickedMesh, false);
		//		//if (isCollided) {
		//		break;
		//		//}
		//	}
		//	grabbing.mesh.position = pos.clone();
		//}

		//const ray = new BABYLON.Ray(this.camera.position, this.camera.getDirection(BABYLON.Axis.Z), cm(1000));
		//const hit = this.scene.pickWithRay(ray, (m) => m.name.includes('__COLLISION_WALL__'))!;
		//if (hit.pickedMesh != null) {
		//	const grabbingBox = this.grabbing.mesh.getBoundingInfo().boundingBox;
		//	const grabDistanceVector = this.grabbing.mesh.position.subtract(this.camera.position);
		//	if (grabDistanceVector.length() > hit.distance) {
		//		this.grabbing.mesh.position = this.camera.position.add(dir.scale(hit.distance));
		//		this.grabbing.mesh.position.y = y;
		//	}
		//}

		//const displacementVector = new BABYLON.Vector3(
		//	this.grabbing.ghost.position.x - this.grabbing.mesh.position.x,
		//	0,
		//	this.grabbing.ghost.position.z - this.grabbing.mesh.position.z,
		//);
		//this.grabbing.mesh.moveWithCollisions(displacementVector);
		//this.grabbing.mesh.position.y = y;

		//for (const soid of stickyObjectIds) {
		//	//const soMesh = this.objectMeshs.get(soid)!;
		//	//const offset = this.grabbing.mesh!.position.subtract(soMeshStartPosition);
		//	//soMesh.position = this.grabbing.mesh!.position.subtract(offset);
		//}

		grabbing.onMove?.({
			position: newPos,
			rotation: newRotation,
			sticky,
		});
	}

	private async loadEnvModel() {
		const envObj = await BABYLON.ImportMeshAsync('/client-assets/room/env.glb', this.scene);
		envObj.meshes[0].scaling = envObj.meshes[0].scaling.scale(WORLD_SCALE);
		envObj.meshes[0].bakeCurrentTransformIntoVertices();
		envObj.meshes[0].position = new BABYLON.Vector3(0, cm(-900), 0); // 4階くらいの想定
		envObj.meshes[0].rotation = new BABYLON.Vector3(0, -Math.PI, 0);
		for (const mesh of envObj.meshes) {
			mesh.isPickable = false;
			mesh.checkCollisions = false;

			//if (mesh.name === '__root__') continue;
			mesh.receiveShadows = false;
			if (mesh.material) (mesh.material as BABYLON.PBRMaterial).reflectionTexture = this.envMapOutdoor;
		}
	}

	private async loadRoomModel() {
		//await BABYLON.InitializeCSG2Async();

		//const box = BABYLON.MeshBuilder.CreateBox('box', { size: cm(50) }, this.scene);
		//const boxCsg = BABYLON.CSG2.FromMesh(box);

		const meshes: BABYLON.Mesh[] = [];

		if (this.roomState.heya.type === 'simple') {
			const floorResult = await BABYLON.ImportMeshAsync('/client-assets/room/rooms/default/300-floor.glb', this.scene);
			floorResult.meshes[0].scaling = floorResult.meshes[0].scaling.scale(WORLD_SCALE);
			const floorRoot = new BABYLON.Mesh('floor', this.scene);
			floorRoot.addChild(floorResult.meshes[0]);
			meshes.push(floorRoot);

			const ceilingResult = await BABYLON.ImportMeshAsync('/client-assets/room/rooms/default/300-ceiling.glb', this.scene);
			ceilingResult.meshes[0].scaling = ceilingResult.meshes[0].scaling.scale(WORLD_SCALE);
			const ceilingRoot = new BABYLON.Mesh('ceiling', this.scene);
			ceilingRoot.addChild(ceilingResult.meshes[0]);
			ceilingRoot.position = new BABYLON.Vector3(0, cm(250), 0);
			meshes.push(ceilingRoot);

			const wallEResult = await BABYLON.ImportMeshAsync('/client-assets/room/rooms/default/300-wall.glb', this.scene);
			wallEResult.meshes[0].scaling = wallEResult.meshes[0].scaling.scale(WORLD_SCALE);
			const wallERoot = new BABYLON.Mesh('wallE', this.scene);
			wallERoot.addChild(wallEResult.meshes[0]);
			wallERoot.position = new BABYLON.Vector3(cm(-150), 0, 0);
			wallERoot.rotation = new BABYLON.Vector3(0, Math.PI, 0);
			meshes.push(wallERoot);
			const wallEMaterial = findMaterial(wallEResult.meshes[0], '__X_WALL__');
			wallEMaterial.albedoColor = new BABYLON.Color3(...this.roomState.heya.options.wallE.color);

			const wallWResult = await BABYLON.ImportMeshAsync('/client-assets/room/rooms/default/300-wall.glb', this.scene);
			wallWResult.meshes[0].scaling = wallWResult.meshes[0].scaling.scale(WORLD_SCALE);
			const wallWRoot = new BABYLON.Mesh('wallW', this.scene);
			wallWRoot.addChild(wallWResult.meshes[0]);
			wallWRoot.position = new BABYLON.Vector3(cm(150), 0, 0);
			meshes.push(wallWRoot);
			const wallWMaterial = findMaterial(wallWResult.meshes[0], '__X_WALL__');
			wallWMaterial.albedoColor = new BABYLON.Color3(...this.roomState.heya.options.wallW.color);

			const wallNResult = await BABYLON.ImportMeshAsync('/client-assets/room/rooms/default/300-wall.glb', this.scene);
			wallNResult.meshes[0].scaling = wallNResult.meshes[0].scaling.scale(WORLD_SCALE);
			const wallNRoot = new BABYLON.Mesh('wallN', this.scene);
			wallNRoot.addChild(wallNResult.meshes[0]);
			wallNRoot.position = new BABYLON.Vector3(0, 0, cm(-150));
			wallNRoot.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
			meshes.push(wallNRoot);
			const wallNMaterial = findMaterial(wallNResult.meshes[0], '__X_WALL__');
			wallNMaterial.albedoColor = new BABYLON.Color3(...this.roomState.heya.options.wallN.color);

			const wallSResult = await BABYLON.ImportMeshAsync('/client-assets/room/rooms/default/300-wall-demado.glb', this.scene);
			wallSResult.meshes[0].scaling = wallSResult.meshes[0].scaling.scale(WORLD_SCALE);
			const wallSRoot = new BABYLON.Mesh('wallS', this.scene);
			wallSRoot.addChild(wallSResult.meshes[0]);
			wallSRoot.position = new BABYLON.Vector3(0, 0, cm(150));
			wallSRoot.rotation = new BABYLON.Vector3(0, -Math.PI / 2, 0);
			meshes.push(wallSRoot);
			const wallSMaterial = findMaterial(wallSResult.meshes[0], '__X_WALL__');
			wallSMaterial.albedoColor = new BABYLON.Color3(...this.roomState.heya.options.wallS.color);
		}

		for (const mesh of meshes) {
			for (const m of mesh.getChildMeshes()) {
				if (m.name.includes('__ROOM_WALL__') || m.name.includes('__ROOM_SIDE__') || m.name.includes('__ROOM_FLOOR__') || m.name.includes('__ROOM_CEILING__') || m.name.includes('__ROOM_TOP__')) {
					m.isPickable = false;
					m.receiveShadows = false;
					m.isVisible = false;
					m.checkCollisions = true;
					this.roomCollisionMeshes.push(m);
					continue;
				}

				if (SNAPSHOT_RENDERING) m.alwaysSelectAsActiveMesh = true;

				m.isPickable = false;
				m.checkCollisions = false;
				m.receiveShadows = true;
				this.shadowGeneratorForRoomLight.addShadowCaster(m);
				this.shadowGeneratorForSunLight.addShadowCaster(m);
				//if (m.material) (m.material as BABYLON.PBRMaterial).ambientColor = new BABYLON.Color3(1, 1, 1);
				if (m.material) {
					(m.material as BABYLON.PBRMaterial).reflectionTexture = this.envMapIndoor;
					(m.material as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts
				}
			}
		}
	}

	private async loadObject(args: {
		type: string;
		id: string;
		position: BABYLON.Vector3;
		rotation: BABYLON.Vector3;
		options: any;
	}) {
		const def = getObjectDef(args.type);

		const root = new BABYLON.TransformNode(`object_${args.id}_${args.type}`, this.scene);

		const filePath = def.path != null ? `/client-assets/room/objects/${def.path}.glb` : `/client-assets/room/objects/${camelToKebab(args.type)}/${camelToKebab(args.type)}.glb`;
		const loaderResult = await BABYLON.LoadAssetContainerAsync(filePath, this.scene);

		// babylonによって自動で追加される右手系変換用ノード
		let subRoot = loaderResult.meshes[0] as BABYLON.TransformNode;

		if (BAKE_TRANSFORM) {
			subRoot.scaling = new BABYLON.Vector3(1, 1, 1);
			subRoot.rotationQuaternion = null;
			subRoot.rotation = new BABYLON.Vector3(0, 0, 0);
			//subRoot.scaling = subRoot.scaling.scale(WORLD_SCALE);// cmをmに
			//subRoot.bakeCurrentTransformIntoVertices();
			//subRoot.bakeTransformIntoVertices(BABYLON.Matrix.Scaling(WORLD_SCALE, WORLD_SCALE, WORLD_SCALE));

			for (const m of loaderResult.transformNodes) {
				if (m.name === '__root__') continue;
				if (m.parent === subRoot) {
					m.setParent(root);
				//m.parent = root;
				}
			}
			for (const m of loaderResult.meshes) {
				if (m.name === '__root__') continue;
				if (m.parent === subRoot) {
					m.setParent(root);
				//m.parent = root;
				}
			}

			const bakeTransformNode = (m: BABYLON.TransformNode) => {
				m.position.x *= -WORLD_SCALE;
				m.position.y *= WORLD_SCALE;
				m.position.z *= WORLD_SCALE;
				m.rotation = m.rotationQuaternion.toEulerAngles();
				m.rotationQuaternion = null;
				//m.rotation.x = -m.rotation.x;
				m.rotation.y = -m.rotation.y;
				m.rotation.z = -m.rotation.z;
				for (const child of m.getChildren()) {
					if (child instanceof BABYLON.Mesh) {
					//child.scaling = child.scaling.scale(WORLD_SCALE);// cmをmに
					//child.position = child.position.scale(WORLD_SCALE);

						const pos = child.position.clone();
						const scaling = child.scaling.clone();
						child.scaling.x = -WORLD_SCALE;
						child.scaling.y = WORLD_SCALE;
						child.scaling.z = WORLD_SCALE;

						const rotation = child.rotationQuaternion ? child.rotationQuaternion.toEulerAngles() : child.rotation.clone();
						child.rotationQuaternion = null;
						child.position = new BABYLON.Vector3(0, 0, 0);

						child.parent = root;
						child.bakeCurrentTransformIntoVertices();
						child.parent = m;
						child.scaling = scaling;
						child.position.x = pos.x * -WORLD_SCALE;
						child.position.y = pos.y * WORLD_SCALE;
						child.position.z = pos.z * WORLD_SCALE;

						child.rotation = rotation;

						scaleMorph(child, [-WORLD_SCALE, WORLD_SCALE, WORLD_SCALE]);

					//const indices = child.getIndices();
					//const positions = child.getVerticesData(BABYLON.VertexBuffer.PositionKind);
					//const normals = child.getVerticesData(BABYLON.VertexBuffer.NormalKind);
					//BABYLON.VertexData.ComputeNormals(positions, indices, normals);
					//child.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals, false, false);
					} else if (child instanceof BABYLON.InstancedMesh) {
						const pos = child.position.clone();
						child.position.x = pos.x * -WORLD_SCALE;
						child.position.y = pos.y * WORLD_SCALE;
						child.position.z = pos.z * WORLD_SCALE;
					} else if (child instanceof BABYLON.TransformNode) {
						bakeTransformNode(child);
					}
				}
			};

			const bakeChildren = (node: BABYLON.Node) => {
				for (const m of node.getChildren(undefined, true)) {
					if (m instanceof BABYLON.Mesh) {
						const scaling = m.scaling.clone();
						m.scaling.x = -WORLD_SCALE;
						m.scaling.y = WORLD_SCALE;
						m.scaling.z = WORLD_SCALE;
						//m.position.x *= -WORLD_SCALE;
						//m.position.y *= WORLD_SCALE;
						//m.position.z *= WORLD_SCALE;
						const pos = m.position.clone();
						const rotation = m.rotationQuaternion.toEulerAngles();
						m.rotationQuaternion = null;
						m.rotation = new BABYLON.Vector3(0, 0, 0);
						m.position = new BABYLON.Vector3(0, 0, 0);
						m.bakeCurrentTransformIntoVertices();
						m.scaling.x = scaling.x;
						m.scaling.y = scaling.y;
						m.scaling.z = scaling.z;
						m.position.x = pos.x * -WORLD_SCALE;
						m.position.y = pos.y * WORLD_SCALE;
						m.position.z = pos.z * WORLD_SCALE;
						m.rotation = rotation;
						//m.rotation.x = -m.rotation.x;
						m.rotation.y = -m.rotation.y;
						m.rotation.z = -m.rotation.z;

						scaleMorph(m, [-WORLD_SCALE, WORLD_SCALE, WORLD_SCALE]);
					} else if (m instanceof BABYLON.InstancedMesh) {
					//const pos = m.position.clone();
					//m.position.x = pos.x * -WORLD_SCALE;
					//m.position.y = pos.y * WORLD_SCALE;
					//m.position.z = pos.z * WORLD_SCALE;
						m.position.x *= -WORLD_SCALE;
						m.position.y *= WORLD_SCALE;
						m.position.z *= WORLD_SCALE;
						m.rotation = m.rotationQuaternion.toEulerAngles();
						m.rotationQuaternion = null;
						m.rotation.x = -m.rotation.x;
						m.rotation.y = -m.rotation.y;
						m.rotation.z = -m.rotation.z;
					} else if (m instanceof BABYLON.TransformNode) {
						bakeTransformNode(m);
					}
				}
			};

			bakeChildren(root);

			subRoot.dispose();
		} else {
			// meshじゃなくtransform nodeにしてパフォーマンス向上
			const _subRoot = new BABYLON.TransformNode('__root__', this.scene);
			_subRoot.scaling.x = -1;
			_subRoot.scaling = _subRoot.scaling.scale(WORLD_SCALE);// cmをmに

			for (const m of subRoot.getChildren()) {
				if (m.parent === subRoot) {
					m.parent = _subRoot;
				}
			}

			subRoot.dispose();
			subRoot = _subRoot;
		}

		def.treatLoaderResult?.(loaderResult);

		const metadata = {
			isObject: true,
			objectId: args.id,
			objectType: args.type,
		};

		if (!BAKE_TRANSFORM) {
			root.addChild(subRoot);
		}

		//const internalCollider = BABYLON.MeshBuilder.CreateBox(`__COLLISION_AUTO_GENERATED_INTERNALY__${root.name}`, { width: 0, height: 0, depth: 0 }, this.scene);
		//internalCollider.isVisible = false;
		//internalCollider.parent = root;

		root.position = args.position.clone();
		root.rotation = args.rotation.clone();
		root.metadata = metadata;

		const model = new ModelManager(BAKE_TRANSFORM ? root : subRoot, loaderResult.meshes.filter(m => m.name !== '__root__'), (meshes) => {
			if (this.selected?.objectId === args.id) {
				this.highlightMeshes(meshes);
			}

			for (const mesh of meshes) {
				// シェイプキー(morph)を考慮してbounding boxを更新するために必要
				mesh.refreshBoundingInfo({ applyMorph: true });

				mesh.metadata = metadata;

				if (SYSTEM_MESH_NAMES.some(n => mesh.name.includes(n))) {
					mesh.receiveShadows = false;
					mesh.isVisible = false;
				} else {
					if (def.receiveShadows !== false) mesh.receiveShadows = true;
					if (def.castShadows !== false) {
						this.shadowGeneratorForRoomLight.addShadowCaster(mesh);
						this.shadowGeneratorForSunLight.addShadowCaster(mesh);
					}

					if (SNAPSHOT_RENDERING) {
						mesh.alwaysSelectAsActiveMesh = true;
					}

					//if (mesh.material) (mesh.material as BABYLON.PBRMaterial).ambientColor = new BABYLON.Color3(0.2, 0.2, 0.2);
					if (mesh.material) {
						if (mesh.material instanceof BABYLON.MultiMaterial) {
							for (const subMat of mesh.material.subMaterials) {
								if ((subMat as BABYLON.PBRMaterial).subSurface.isRefractionEnabled) {
									(subMat as BABYLON.PBRMaterial).subSurface.isRefractionEnabled = false; // 有効にするとドローコールが激増する(babylonのバグか仕様かは不明)
									(subMat as BABYLON.PBRMaterial).transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
								}
								(subMat as BABYLON.PBRMaterial).reflectionTexture = this.envMapIndoor;
								(subMat as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts
								(subMat as BABYLON.PBRMaterial).anisotropy.isEnabled = false; // なんかきれいにレンダリングされないため
							}
						} else {
							if ((mesh.material as BABYLON.PBRMaterial).subSurface.isRefractionEnabled) {
								(mesh.material as BABYLON.PBRMaterial).subSurface.isRefractionEnabled = false; // 有効にするとドローコールが激増する(babylonのバグか仕様かは不明)
								(mesh.material as BABYLON.PBRMaterial).transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
							}
							(mesh.material as BABYLON.PBRMaterial).reflectionTexture = this.envMapIndoor;
							(mesh.material as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts
							(mesh.material as BABYLON.PBRMaterial).anisotropy.isEnabled = false; // なんかきれいにレンダリングされないため
						}
					}
				}

				if (!this.scene.meshes.includes(mesh)) this.scene.addMesh(mesh);
			}

			if (def.hasCollisions) {
				enableObjectCollision(meshes);
			}
		});

		const objectInstance = await def.createInstance({
			room: this,
			scene: this.scene,
			root,
			options: args.options,
			model,
			id: args.id,
			stickyMarkerMeshUpdated: (mesh) => {
				// TODO
				//// stickyな子の位置を更新
				//if (mesh.name.includes('__TOP__')) {
				//	mesh.unfreezeWorldMatrix();
				//	mesh.computeWorldMatrix(true);
				//	const updateChildStickyObjectPosition = (objectId: string) => {
				//		const stickyObjectIds = Array.from(this.roomState.installedObjects.filter(o => o.sticky === objectId)).map(o => o.id);
				//		for (const soid of stickyObjectIds) {
				//			const soMesh = this.objectEntities.get(soid)!.rootMesh;
				//			soMesh.unfreezeWorldMatrix();
				//			for (const m of soMesh.getChildMeshes()) {
				//				m.unfreezeWorldMatrix();
				//			}
				//			console.log(mesh.getAbsolutePosition().y);
				//			soMesh.position.y = mesh.getAbsolutePosition().y;
				//			updateChildStickyObjectPosition(soid);
				//		}
				//	};
				//	updateChildStickyObjectPosition(args.id);
				//}
			},
		});

		objectInstance.onInited?.();

		model.bakeMesh();

		if (def.hasCollisions) {
			enableObjectCollision(root.getChildMeshes());
		}

		this.objectEntities.set(args.id, { instance: objectInstance, rootMesh: root, model });

		return { root, objectInstance };
	}

	private highlightMeshes(meshes: BABYLON.AbstractMesh[]) {
		this.clearHighlight();
		this.selectionOutlineLayer.addSelection(meshes);
	}

	private clearHighlight() {
		this.selectionOutlineLayer.clearSelection();
	}

	public beginSelectedInstalledObjectGrabbing() {
		if (this.selected == null) return;

		const selectedObject = this.selected.objectEntity.rootMesh;
		this.clearHighlight();

		// 子から先に適用していく
		const setStickyParentRecursively = (mesh: BABYLON.AbstractMesh) => {
			const stickyObjectIds = Array.from(this.roomState.installedObjects.filter(o => o.sticky === mesh.metadata.objectId)).map(o => o.id);
			for (const soid of stickyObjectIds) {
				const soMesh = this.objectEntities.get(soid)!.rootMesh;
				setStickyParentRecursively(soMesh);
				soMesh.setParent(mesh);
				soMesh.unfreezeWorldMatrix();
				for (const m of soMesh.getChildMeshes()) {
					m.unfreezeWorldMatrix();
				}
			}
		};
		setStickyParentRecursively(selectedObject);

		const descendantStickyObjectIds: string[] = [];
		const collectDescendantStickyObjectIds = (parentId: string) => {
			const childIds = Array.from(this.roomState.installedObjects.filter(o => o.sticky === parentId)).map(o => o.id);
			for (const cid of childIds) {
				descendantStickyObjectIds.push(cid);
				collectDescendantStickyObjectIds(cid);
			}
		};
		collectDescendantStickyObjectIds(selectedObject.metadata.objectId);

		const placement = getObjectDef(selectedObject.metadata.objectType).placement;

		if (placement === 'top') {
			// stickyな場合にsticky先とのレイの距離が0になりstickyされていない初期状態でgrabbingが始まってしまうのでちょっと浮かす
			selectedObject.position.y += cm(1);
		}

		const distance = BABYLON.Vector3.Distance(this.camera.position, selectedObject.position);
		const ghost = this.createGhost(selectedObject);

		const dir = this.camera.getDirection(BABYLON.Axis.Z).scale(this.scene.useRightHandedSystem ? -1 : 1);

		const initialPosition = selectedObject.position.clone();
		const initialRotation = selectedObject.rotation.clone();

		let sticky: string | null;

		this.grabbingCtx = {
			objectId: selectedObject.metadata.objectId,
			objectType: selectedObject.metadata.objectType,
			forInstall: false,
			mesh: selectedObject,
			originalDiffOfPosition: selectedObject.position.subtract(this.camera.position.add(dir.scale(distance))),
			originalDiffOfRotationY: selectedObject.rotation.subtract(this.camera.rotation).y,
			distance: distance,
			rotation: 0,
			ghost: ghost,
			descendantStickyObjectIds,
			onMove: (info) => {
				sticky = info.sticky;
			},
			onCancel: () => {
				// todo: initialPositionなどを復元
			},
			onDone: () => { // todo: sticky状態などを引数でもらうようにしたい
				this.putParticleSystem.emitter = selectedObject.position.clone();
				this.putParticleSystem.start();

				this.playSfxUrl('/client-assets/room/sfx/put.mp3', {
					volume: 1,
					playbackRate: 1,
				});

				// put animation
				const animTarget = new BABYLON.Animation(
					'',
					'scaling',
					60,
					BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
					BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
				);
				const keys = [
					{ frame: 0, value: new BABYLON.Vector3(1, 1.2, 1) },
					{ frame: 60, value: new BABYLON.Vector3(1, 1, 1) },
				];
				animTarget.setKeys(keys);
				const easing = new BABYLON.ElasticEase(2);
				easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
				animTarget.setEasingFunction(easing);
				selectedObject.animations.push(animTarget);
				const animating = Promise.withResolvers<void>();
				this.scene.beginAnimation(selectedObject, 0, 60, false, 3, () => { animating.resolve(); });

				// TODO: アニメーションの完了まで親子関係の解除を遅延するため、一瞬「grabbingが終わっているのに親子関係が解除されていない」状態が発生する。その間に新たにgrabbingを開始するなどの別の操作が発生すると不具合のもとになるのでそれを防止する仕組みを作る
				animating.promise.then(() => {
					// 親から先に外していく
					const removeStickyParentRecursively = (mesh: BABYLON.Mesh) => {
						const stickyObjectIds = Array.from(this.roomState.installedObjects.filter(o => o.sticky === mesh.metadata.objectId)).map(o => o.id);
						for (const soid of stickyObjectIds) {
							const soMesh = this.objectEntities.get(soid)!.rootMesh;
							soMesh.setParent(null);

							const pos = soMesh.position.clone();
							const rotation = soMesh.rotation.clone();
							this.roomState.installedObjects.find(o => o.id === soid)!.position = [pos.x, pos.y, pos.z];
							this.roomState.installedObjects.find(o => o.id === soid)!.rotation = [rotation.x, rotation.y, rotation.z];

							removeStickyParentRecursively(soMesh);
						}
					};
					removeStickyParentRecursively(selectedObject);

					const pos = selectedObject.position.clone();
					const rotation = selectedObject.rotation.clone();
					this.roomState.installedObjects.find(o => o.id === selectedObject.metadata.objectId)!.sticky = sticky;
					this.roomState.installedObjects.find(o => o.id === selectedObject.metadata.objectId)!.position = [pos.x, pos.y, pos.z];
					this.roomState.installedObjects.find(o => o.id === selectedObject.metadata.objectId)!.rotation = [rotation.x, rotation.y, rotation.z];

					this.emit('changeRoomState', { roomState: this.roomState });
				});
			},
		};

		const intervalId = setInterval(() => {
			this.handleGrabbing();
		}, 10);

		this.intervalIds.push(intervalId);

		this.playSfxUrl('/client-assets/room/sfx/grab.mp3', {
			volume: 1,
			playbackRate: 1,
		});
	}

	public endGrabbing() {
		if (this.grabbingCtx == null) return;

		//this.grabbing.ghost.dispose(false, true);
		this.grabbingCtx.ghost.dispose(false, false);
		this.grabbingCtx.onDone?.();
		this.grabbingCtx = null;

		this.xGridPreviewPlane.isVisible = false;
		this.yGridPreviewPlane.isVisible = false;
		this.zGridPreviewPlane.isVisible = false;
	}

	public interact(oid: string) {
		const o = this.roomState.installedObjects.find(o => o.id === oid)!;
		const objDef = getObjectDef(o.type);
		const entity = this.objectEntities.get(o.id)!;

		if (objDef.isChair) {
			this.sitChair(o.id);
		} else {
			if (entity.instance.primaryInteraction != null) {
				entity.instance.interactions[entity.instance.primaryInteraction].fn();
			}
		}
	}

	public sitChair(objectId: string) {
		this.isSitting = true;
		this.fixedCamera.parent = this.objectMeshs.get(objectId);
		this.fixedCamera.position = new BABYLON.Vector3(0, cm(120), 0);
		this.fixedCamera.rotation = new BABYLON.Vector3(0, 0, 0);
		this.scene.activeCamera = this.fixedCamera;
		this.selectObject(null);
	}

	public standUp() {
		this.isSitting = false;
		this.scene.activeCamera = this.camera;
		this.fixedCamera.parent = null;
	}

	private turnOnRoomLight() {
		this.roomLight.intensity = 10 * WORLD_SCALE * WORLD_SCALE;
		this.envMapIndoor.level = 0.6;
	}

	private turnOffRoomLight() {
		this.roomLight.intensity = 0;
		this.envMapIndoor.level = 0;
	}

	public toggleRoomLight() {
		if (this.roomLight.intensity > 0) {
			this.turnOffRoomLight();
		} else {
			this.turnOnRoomLight();
		}
	}

	private createGhost(mesh: BABYLON.Mesh): BABYLON.Mesh {
		const ghost = mesh.clone('ghost', null, false)!;
		ghost.metadata = { isGhost: true };
		ghost.checkCollisions = false;
		for (const m of ghost.getChildMeshes()) {
			m.metadata = { isGhost: true };
			m.checkCollisions = false;
		}

		const materials = new WeakMap<BABYLON.Material, BABYLON.Material>();

		for (const m of ghost.getChildMeshes() as BABYLON.Mesh[]) {
			if (m.material == null) continue;

			if (materials.has(m.material)) {
				m.material = materials.get(m.material)!;
				continue;
			}

			if (m.subMeshes != null && m.subMeshes.length > 0 && m.material.subMaterials != null) {
				const multiGhostMaterial = m.material.clone(`${m.material.name}_ghost`) as BABYLON.MultiMaterial;

				for (let i = 0; i < multiGhostMaterial.subMaterials.length; i++) {
					const subMaterial = multiGhostMaterial.subMaterials[i];
					const ghostMaterial = subMaterial.clone(`${subMaterial.name}_ghost`);
					ghostMaterial.alpha = 0.3;
					ghostMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
					multiGhostMaterial.subMaterials[i] = ghostMaterial;
					materials.set(m.material, multiGhostMaterial);
					m.material = multiGhostMaterial;
				}
			} else {
				const ghostMaterial = m.material.clone(`${m.material.name}_ghost`);
				ghostMaterial.alpha = 0.3;
				ghostMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
				materials.set(m.material, ghostMaterial);
				m.material = ghostMaterial;
			}
		}

		return ghost;
	}

	public async addObject(type: string) {
		if (!this.isEditMode) return;
		if (this.grabbingCtx != null) return;
		this.selectObject(null);

		const dir = this.camera.getDirection(BABYLON.Axis.Z).scale(this.scene.useRightHandedSystem ? -1 : 1);
		const distance = cm(50);

		const id = genId();

		const def = getObjectDef(type);

		const options = deepClone(def.options.default);

		const { root } = await this.loadObject({
			id: id,
			type,
			position: new BABYLON.Vector3(0, 0, 0),
			rotation: new BABYLON.Vector3(0, Math.PI, 0),
			options,
		});

		root.unfreezeWorldMatrix();
		for (const m of root.getChildMeshes()) {
			m.unfreezeWorldMatrix();
			m.checkCollisions = false;
		}

		const ghost = this.createGhost(root);

		let sticky: string | null;

		this.grabbingCtx = {
			objectId: id,
			objectType: type,
			forInstall: true,
			mesh: root,
			originalDiffOfPosition: new BABYLON.Vector3(0, 0, 0),
			originalDiffOfRotationY: Math.PI,
			distance: distance,
			rotation: 0,
			ghost: ghost,
			descendantStickyObjectIds: [],
			onMove: (info) => {
				sticky = info.sticky;
			},
			onCancel: () => {
				// todo
			},
			onDone: () => { // todo: sticky状態などを引数でもらうようにしたい
				if (def.hasCollisions) {
					enableObjectCollision(root.getChildMeshes());
				}

				const pos = root.position.clone();
				const rotation = root.rotation.clone();

				this.putParticleSystem.emitter = pos;
				this.putParticleSystem.start();

				this.playSfxUrl('/client-assets/room/sfx/put.mp3', {
					volume: 1,
					playbackRate: 1,
				});

				// put animation
				const animTarget = new BABYLON.Animation(
					'',
					'scaling',
					60,
					BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
					BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
				);
				const keys = [
					{ frame: 0, value: new BABYLON.Vector3(1, 1.2, 1) },
					{ frame: 60, value: new BABYLON.Vector3(1, 1, 1) },
				];
				animTarget.setKeys(keys);
				const easing = new BABYLON.ElasticEase(2);
				easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
				animTarget.setEasingFunction(easing);
				root.animations.push(animTarget);
				this.scene.beginAnimation(root, 0, 60, false, 3);

				this.roomState.installedObjects.push({
					id,
					type,
					position: [pos.x, pos.y, pos.z],
					rotation: [rotation.x, rotation.y, rotation.z],
					sticky,
					options,
				});

				this.emit('changeRoomState', { roomState: this.roomState });
			},
		};

		const intervalId = setInterval(() => {
			this.handleGrabbing();
		}, 10);

		this.intervalIds.push(intervalId);

		this.playSfxUrl('/client-assets/room/sfx/grab.mp3', {
			volume: 1,
			playbackRate: 1,
		});
	}

	public enterEditMode() {
		this.isEditMode = true;

		for (const entity of this.objectEntities.values()) {
			entity.instance.resetTemporaryState?.();
		}
	}

	public async exitEditMode() {
		this.isEditMode = false;

		await this.bake();
	}

	public async bake() {
		/*
		const reflectionProbe = new BABYLON.ReflectionProbe('', 256, this.scene, true, true, true);
		reflectionProbe.position = new BABYLON.Vector3(0, 150, 0);
		reflectionProbe.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
		reflectionProbe.renderList = this.scene.meshes.filter(m => (m instanceof BABYLON.Mesh || m instanceof BABYLON.InstancedMesh) && m.isEnabled() && m.isVisible && m.material);
		this.scene.customRenderTargets.push(reflectionProbe.cubeTexture);
		reflectionProbe.cubeTexture.render();

		await new Promise(res => window.setTimeout(res, 2000));

		const tex = reflectionProbe.cubeTexture;
		reflectionProbe.renderList = [];

		const sphere = BABYLON.MeshBuilder.CreateSphere('', { diameter: 50 }, this.scene);
		sphere.position = new BABYLON.Vector3(0, 100, 0);
		const mat = new BABYLON.PBRMaterial('', this.scene);
		mat.metallic = 1;
		mat.roughness = 0;
		mat.reflectionTexture = tex;
		sphere.material = mat;

		reflectionProbe.renderList = [];
		//reflectionProbe.dispose();

		for (const mesh of this.scene.meshes.filter(m => (m instanceof BABYLON.Mesh || m instanceof BABYLON.InstancedMesh) && m.isEnabled() && m.isVisible && m.material && m.metadata?.isObject)) {
			if (mesh.material) {
				mesh.material.unfreeze();
				if (mesh.material instanceof BABYLON.MultiMaterial) {
					for (const subMat of mesh.material.subMaterials) {
						subMat.unfreeze();
						(subMat as BABYLON.PBRMaterial).reflectionTexture = tex;
						(subMat as BABYLON.PBRMaterial).realTimeFiltering = true;
					}
				} else {
					(mesh.material as BABYLON.PBRMaterial).reflectionTexture = tex;
					(mesh.material as BABYLON.PBRMaterial).realTimeFiltering = true;
				}
			}
		}
			*/
	}

	public removeSelectedObject() {
		if (this.selected == null) return;

		const objectId = this.selected.objectId;

		this.objectEntities.get(objectId)?.rootMesh.dispose();
		this.objectEntities.delete(objectId);
		this.roomState.installedObjects = this.roomState.installedObjects.filter(o => o.id !== objectId);
		for (const o of this.roomState.installedObjects.filter(o => o.sticky === objectId)) {
			o.sticky = null;
		}
		this.emit('changeRoomState', { roomState: this.roomState });
		this.selected = null;

		this.playSfxUrl('/client-assets/room/sfx/remove.mp3', {
			volume: 1,
			playbackRate: 1,
		});
	}

	public changeGrabbingDistance(delta: number) {
		if (this.grabbingCtx == null) return;
		this.grabbingCtx.distance -= delta;
		if (this.grabbingCtx.distance < cm(5)) this.grabbingCtx.distance = cm(5);
	}

	public changeGrabbingRotationY(delta: number) {
		if (this.grabbingCtx == null) return;
		this.grabbingCtx.rotation += delta;
	}

	public updateObjectOption(objectId: string, key: string, value: any) {
		const options = this.roomState.installedObjects.find(o => o.id === objectId)?.options;
		if (options == null) return;
		options[key] = value;

		this.emit('changeRoomState', { roomState: this.roomState });

		const entity = this.objectEntities.get(objectId);
		if (entity == null) return;
		entity.instance.onOptionsUpdated?.([key, value]);

		if (this.selected?.objectId === objectId) {
			// TODO
			//triggerRef(this.selected);
		}
	}

	public showBoundingBox() {
		for (const mesh of this.objectMeshs.values()) {
			for (const m of mesh.getChildMeshes()) {
				m.showBoundingBox = true;
			}
		}
	}

	private playSfxUrl(url: string, options: { volume: number; playbackRate: number }) {
		this.emit('playSfxUrl', { url, options });
	}

	public resize() {
		this.engine.resize();
	}

	public destroy() {
		for (const id of this.intervalIds) {
			window.clearInterval(id);
		}
		for (const id of this.timeoutIds) {
			window.clearTimeout(id);
		}
		this.intervalIds = [];
		this.timeoutIds = [];
		this.engine.dispose();
		this.disposed = true;
	}
}

export async function createRoomObjectPreviewEngine(canvas: HTMLCanvasElement) {
	//const babylonEngine = new BABYLON.WebGPUEngine(canvas);
	//babylonEngine.compatibilityMode = false;
	//await babylonEngine.initAsync();
	const babylonEngine = new BABYLON.Engine(canvas, false, { alpha: false, antialias: false });
	return new RoomObjectPreviewEngine({ canvas, engine: babylonEngine });
}

export class RoomObjectPreviewEngine {
	private canvas: HTMLCanvasElement;
	private engine: BABYLON.WebGPUEngine;
	private scene: BABYLON.Scene;
	private shadowGenerator1: BABYLON.ShadowGenerator;
	private camera: BABYLON.ArcRotateCamera;
	private objectMesh: BABYLON.Mesh | null = null;
	private objectInstance: RoomObjectInstance<any> | null = null;
	private envMapIndoor: BABYLON.CubeTexture;
	private roomLight: BABYLON.SpotLight;
	private zGridPreviewPlane: BABYLON.Mesh;
	private fps = 60;

	constructor(options: {
		canvas: HTMLCanvasElement;
		engine: BABYLON.WebGPUEngine;
	}) {
		this.canvas = options.canvas;

		registerBuiltInLoaders();

		this.engine = options.engine;
		this.scene = new BABYLON.Scene(this.engine);

		this.scene.ambientColor = new BABYLON.Color3(1.0, 0.9, 0.8);

		this.envMapIndoor = BABYLON.CubeTexture.CreateFromPrefilteredData('/client-assets/room/indoor.env', this.scene);
		this.envMapIndoor.boundingBoxSize = new BABYLON.Vector3(cm(500), cm(500), cm(500));

		this.camera = new BABYLON.ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 2.5, cm(300), new BABYLON.Vector3(0, cm(90), 0), this.scene);
		this.camera.attachControl(this.canvas);
		this.camera.minZ = cm(1);
		this.camera.maxZ = cm(100000);
		this.camera.fov = 0.5;
		this.camera.lowerBetaLimit = 0;
		this.camera.upperBetaLimit = (Math.PI / 2) + 0.1;
		this.camera.lowerRadiusLimit = cm(50);
		this.camera.upperRadiusLimit = cm(1000);
		this.camera.useAutoRotationBehavior = true;
		this.camera.autoRotationBehavior!.idleRotationSpeed = 0.3;
		//this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
		this.scene.activeCamera = this.camera;

		const ambientLight = new BABYLON.HemisphericLight('ambientLight', new BABYLON.Vector3(0, 1, -0.5), this.scene);
		ambientLight.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
		ambientLight.intensity = 0.5;
		//ambientLight.intensity = 0;

		this.roomLight = new BABYLON.SpotLight('roomLight', new BABYLON.Vector3(0, cm(249), 0), new BABYLON.Vector3(0, -1, 0), 16, 8, this.scene);
		this.roomLight.diffuse = new BABYLON.Color3(1.0, 0.9, 0.8);
		this.roomLight.shadowMinZ = cm(10);
		this.roomLight.shadowMaxZ = cm(300);

		this.shadowGenerator1 = new BABYLON.ShadowGenerator(4096, this.roomLight);
		this.shadowGenerator1.forceBackFacesOnly = true;
		this.shadowGenerator1.bias = 0.0001;
		this.shadowGenerator1.usePercentageCloserFiltering = true;
		this.shadowGenerator1.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
		//this.shadowGenerator1.useContactHardeningShadow = true;

		const gridMaterial = new GridMaterial('grid', this.scene);
		gridMaterial.lineColor = new BABYLON.Color3(0.5, 0.5, 0.5);
		gridMaterial.mainColor = new BABYLON.Color3(0, 0, 0);
		gridMaterial.minorUnitVisibility = 1;
		gridMaterial.opacity = 0.5;
		gridMaterial.gridRatio = cm(10);

		//this.zGridPreviewPlane = BABYLON.MeshBuilder.CreatePlane('zGridPreviewPlane', { width: cm(1000), height: cm(1000) }, this.scene);
		//this.zGridPreviewPlane.material = gridMaterial;
		//this.zGridPreviewPlane.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);

		//this.scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
		//this.scene.fogStart = cm(100);
		//this.scene.fogEnd = cm(110);
		//this.scene.fogColor = new BABYLON.Color3(0.0, 0.0, 0.0);
	}

	public async init() {
		const frameInterval = 1000 / this.fps;
		let lastTime = performance.now();

		this.engine.runRenderLoop(() => {
			const currentTime = performance.now();
			const delta = currentTime - lastTime;

			if (delta >= frameInterval) {
				this.scene.render();
				lastTime = currentTime - (delta % frameInterval);
			}
		});
	}

	public async load(type: string) {
		if (this.objectInstance != null) {
			this.objectInstance.dispose?.();
			this.objectInstance = null;
			this.objectMesh!.dispose();
		}

		// reset camera rotation
		this.camera.setPosition(new BABYLON.Vector3(0, cm(90), cm(300)));

		const def = getObjectDef(type);

		const options = deepClone(def.options.default);

		const id = genId();

		await this.loadObject({
			type,
			options,
			id,
		});

		// なぜかちょっと待たないとbounding boxのサイズが正しくない
		window.setTimeout(() => {
			const boundingInfo = getMeshesBoundingBox(this.objectMesh!.getChildMeshes().filter(m => m.isEnabled() && m.isVisible));
			this.camera.setTarget(new BABYLON.Vector3(0, boundingInfo.center.y, 0));

			// zoom to fit
			const size = boundingInfo.extendSize;
			const distance = Math.max(size.x, size.y, size.z) * 2;
			this.camera.radius = distance * 3;
			//this.camera.orthoLeft = -distance;
			//this.camera.orthoRight = distance;
			//this.camera.orthoTop = distance;
			//this.camera.orthoBottom = -distance;
		}, 10);
	}

	// TODO: RoomEngineのものとほぼ同じだからいい感じに共通化
	private async loadObject(args: {
		type: string;
		options: any;
		id: string;
	}) {
		const def = getObjectDef(args.type);

		const root = new BABYLON.Mesh(`object_${args.type}`, this.scene);

		const filePath = def.path != null ? `/client-assets/room/objects/${def.path}.glb` : `/client-assets/room/objects/${camelToKebab(args.type)}/${camelToKebab(args.type)}.glb`;
		const loaderResult = await BABYLON.LoadAssetContainerAsync(filePath, this.scene);

		// babylonによって自動で追加される右手系変換用ノード
		const subRoot = loaderResult.meshes[0];
		subRoot.scaling = subRoot.scaling.scale(WORLD_SCALE);// cmをmに

		def.treatLoaderResult?.(loaderResult);

		root.addChild(subRoot);

		const model = new ModelManager(subRoot, loaderResult.meshes.filter(m => m !== subRoot), (meshes) => {
			for (const m of meshes) {
				const mesh = m;

				// シェイプキー(morph)を考慮してbounding boxを更新するために必要
				mesh.refreshBoundingInfo({ applyMorph: true });

				if (SYSTEM_MESH_NAMES.some(n => mesh.name.includes(n))) {
					mesh.receiveShadows = false;
					mesh.isVisible = false;
				} else {
					if (def.receiveShadows !== false) mesh.receiveShadows = true;
					if (def.castShadows !== false) {
						this.shadowGenerator1.addShadowCaster(mesh);
					}

					if (mesh.material) {
						if (mesh.material instanceof BABYLON.MultiMaterial) {
							for (const subMat of mesh.material.subMaterials) {
								(subMat as BABYLON.PBRMaterial).reflectionTexture = this.envMapIndoor;
								(subMat as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts
							}
						} else {
							(mesh.material as BABYLON.PBRMaterial).reflectionTexture = this.envMapIndoor;
							(mesh.material as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts
						}
					}
				}

				if (!this.scene.meshes.includes(mesh)) this.scene.addMesh(mesh);
			}
		});

		const objectInstance = await def.createInstance({
			room: null,
			scene: this.scene,
			root,
			options: args.options,
			model,
			id: args.id,
		});

		objectInstance.onInited?.();

		model.bakeMesh();

		this.objectInstance = objectInstance;
		this.objectMesh = root;
	}

	public updateObjectOption(key: string, value: any) {
		this.objectInstance?.onOptionsUpdated?.([key, value]);
	}

	public resize() {
		this.engine.resize();
	}

	public destroy() {
		this.engine.dispose();
	}
}
