import {
	CubismFramework,
	ICubismModelSetting,
	CubismMatrix44,
	CubismEyeBlink,
	CubismModelSettingJson,
	CubismMotionManager,
	ACubismMotion,
	CubismExpressionMotion,
	CubismMotion,
} from './live2d-sdk';
import AppCubismUserModel from './cubism-model';
import { FacePoint } from './face-point';

export interface AvatarArrayBuffers {
	moc3: ArrayBuffer;
	textures: Blob[];
	physics: ArrayBuffer;
	expressions: [string, ArrayBuffer][];
	motions: [string, ArrayBuffer][];
}
interface Live2dRendererOption {
	autoBlink: boolean;
	x: number;
	y: number;
	scale: number;
}
const DEFAULT_OPTION: Live2dRendererOption = {
	autoBlink: true,
	x: 0,
	y: 0,
	scale: 1,
};

let isFrameworkInitialized = false;

export class Live2dRenderer {
	private canvas: HTMLCanvasElement;
	private model = new AppCubismUserModel();
	private point = new FacePoint();

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
	}

	public async init(_model: ArrayBuffer, buffers: AvatarArrayBuffers, options: Partial<Live2dRendererOption> = {}) {
		/**
		 * WebGLコンテキストの初期化
		 */

		const gl = this.canvas.getContext('webgl');
		if (gl === null) throw new Error('WebGL未対応のブラウザです。');

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.clearColor(0.0, 0.0, 0.0, 0.0);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);

		const option = Object.assign({}, DEFAULT_OPTION, options);

		// フレームバッファを用意
		const frameBuffer: WebGLFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);

		/**
			* Frameworkの初期化
			*/
		if (!isFrameworkInitialized) {
			CubismFramework.startUp();
			CubismFramework.initialize();
			isFrameworkInitialized = true;
		}

		const modelSetting = new CubismModelSettingJson(_model, _model.byteLength) as ICubismModelSetting;

		const {
			moc3: moc3ArrayBuffer,
			textures,
			physics: physics3ArrayBuffer,
			expressions,
			motions,
		} = buffers;

		/**
			* Live2Dモデルの作成と設定
			*/

		// モデルデータをロード
		this.model.loadModel(moc3ArrayBuffer);

		// レンダラの作成（bindTextureより先にやっておく）
		this.model.createRenderer();

		// テクスチャをレンダラに設定
		let i = 0;
		for (const buffer of textures) {
			const texture = await createTexture(buffer, gl);
			this.model.getRenderer()
				.bindTexture(i, texture);
			i++;
		}

		// そのほかレンダラの設定
		this.model.getRenderer().setIsPremultipliedAlpha(true);
		this.model.getRenderer().startUp(gl);

		// 自動目ぱち設定
		if (option.autoBlink) {
			this.model.setEyeBlink(CubismEyeBlink.create(modelSetting));
		}

		// モーションに適用する目ぱち用IDを設定
		for (let i = 0, len = modelSetting.getEyeBlinkParameterCount(); i < len; i++) {
			this.model.addEyeBlinkParameterId(modelSetting.getEyeBlinkParameterId(i));
		}

		// モーションに適用する口パク用IDを設定
		for (let i = 0, len = modelSetting.getLipSyncParameterCount(); i < len; i++) {
			this.model.addLipSyncParameterId(modelSetting.getLipSyncParameterId(i));
		}

		// 物理演算設定
		this.model.loadPhysics(physics3ArrayBuffer, physics3ArrayBuffer.byteLength);

		// 表情
		for (const [k, v] of expressions) {
			this.model.addExpression(v, k);
		}

		// モーション
		for (const [k, v] of motions) {
			this.model.addMotion(v, k);
		}

		/**
			* Live2Dモデルのサイズ調整
			*/
		const defaultPosition = Object.assign({
			x: 0,
			y: 0,
			z: 1
		}, {
			x: option.x,
			y: option.y,
			z: option.scale
		});

		const projectionMatrix = new CubismMatrix44();

		const resizeModel = () => {
			this.canvas.width = this.canvas.clientWidth * devicePixelRatio;
			this.canvas.height = this.canvas.clientHeight * devicePixelRatio;

			// NOTE: modelMatrixは、モデルのユニット単位での幅と高さが1×1に収まるように縮めようとしている？
			const modelMatrix = this.model.getModelMatrix();
			modelMatrix.bottom(0);
			modelMatrix.centerY(-1);
			modelMatrix.translateY(-1);
			projectionMatrix.loadIdentity();
			const canvasRatio = this.canvas.height / this.canvas.width;
			if (1 < canvasRatio) {
				// モデルが横にはみ出る時は、HTMLキャンバスの幅で合わせる
				modelMatrix.scale(1, this.canvas.width / this.canvas.height);
			} else {
				// モデルが上にはみ出る時は、HTMLキャンバスの高さで合わせる（スマホのランドスケープモードとか）
				modelMatrix.scale(this.canvas.height / this.canvas.width, 1);
			}
			modelMatrix.translateRelative(defaultPosition.x, defaultPosition.y);
			// モデルが良い感じの大きさになるように拡大・縮小
			projectionMatrix.multiplyByMatrix(modelMatrix);
			const scale = defaultPosition.z;
			projectionMatrix.scaleRelative(scale, scale);
			this.model.getRenderer().setMvpMatrix(projectionMatrix);
		};
		resizeModel();

		/**
			* Live2Dモデルの描画
			*/

			// フレームバッファとビューポートを、フレームワーク設定
		const viewport: number[] = [
				0,
				0,
				this.canvas.width,
				this.canvas.height
			];

		// 最後の更新時間
		let lastUpdateTime = Date.now();

		const __model = this.model.getModel();
		const idManager = CubismFramework.getIdManager();

		const loop = () => {
			const time = Date.now();
			// 最後の更新からの経過時間を秒で求める
			const deltaTimeSecond = (time - lastUpdateTime) / 1000;

			// モデルの位置調整
			__model.setParameterValueById(idManager.getId('ParamAngleX'), this.point.angleX, .5);
			__model.setParameterValueById(idManager.getId('ParamAngleY'), this.point.angleY, .5);
			__model.setParameterValueById(idManager.getId('ParamAngleZ'), this.point.angleZ, .5);
			__model.setParameterValueById(idManager.getId('ParamEyeBallX'), this.point.angleEyeX, .5);
			__model.setParameterValueById(idManager.getId('ParamEyeBallY'), this.point.angleEyeY, .5);
			//__model.setParameterValueById(idManager.getId('ParamMouthOpenY'), this.point.mouseDistance * 0.1, .5);
			__model.setParameterValueById(idManager.getId('ParamBodyAngleZ'), this.point.angleZ / 2, .05);
			__model.saveParameters();
			// 頂点の更新
			this.model.update(deltaTimeSecond);

			viewport[2] = this.canvas.width;
			viewport[3] = this.canvas.height;
			this.model.getRenderer().setRenderState(frameBuffer, viewport);

			// モデルの描画
			this.model.getRenderer().drawModel();

			lastUpdateTime = time;

			// TODO: cancelできる仕組みを提供する
			requestAnimationFrame(loop);
		};

		window.addEventListener('resize', () => {
			resizeModel();
			loop();
		});
		loop();

		// TODO: ランダムにあくび or aiart
		/*
					if (this.model.isMotionFinished) {
				const idx = Math.floor(Math.random() * this.model.motionNames.length);
				const name = this.model.motionNames[idx];
				this.model.startMotionByName(name);
			}
*/
	}

	public updatePoint(newPoint: Partial<FacePoint>) {
		Object.assign(this.point, newPoint);
	}

	public click(ev: MouseEvent) {
		const rect = this.canvas.getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		const x = (ev.clientX - cx) / (rect.width / 2);
		const y = (ev.clientY - cy) / (rect.height / 2);

		// なんかbody->head, head->boobになってるっぽい
		if (this.model.isHit(CubismFramework.getIdManager().getId('HitArea_Body'), x, y)) {
			this.model.startMotionByName('mimi');
			this.model.startExpressionByName('smile');
		} else if (this.model.isHit(CubismFramework.getIdManager().getId('HitArea_Head'), x, y)) {
			this.model.startExpressionByName('jitome');
		}
	}
}

/**
 * テクスチャを生成する
 * @param path テクスチャのパス
 * @param gl WebGLコンテキスト
 */
async function createTexture(blob: Blob, gl: WebGLRenderingContext): Promise<WebGLTexture> {
	return new Promise((resolve: (texture: WebGLTexture) => void) => {
		const url = URL.createObjectURL(blob);
		const img: HTMLImageElement = new Image();
		img.onload = () => {
			const tex: WebGLTexture = gl.createTexture() as WebGLTexture;

			// テクスチャを選択
			gl.bindTexture(gl.TEXTURE_2D, tex);

			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

			// 乗算済みアルファ方式を使用する
			gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);

			// テクスチャにピクセルを書き込む
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

			// ミップマップを生成
			gl.generateMipmap(gl.TEXTURE_2D);
			URL.revokeObjectURL(url);
			return resolve(tex);
		};
		img.addEventListener('error',() => {
			console.error(`image load error`);
		});
		img.src = url;

	});

}
