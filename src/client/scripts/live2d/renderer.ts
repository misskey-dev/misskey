import {
	CubismFramework,
	ICubismModelSetting,
	CubismMatrix44,
	CubismEyeBlink,
	CubismModelSettingJson,
} from './live2d-sdk'
import AppCubismUserModel from './cubism-model'
import { FacePoint } from './face-point'

export interface AvatarArrayBuffers {
	moc3: ArrayBuffer
	textures: Blob[]
	physics: ArrayBuffer
}
interface Live2dRendererOption {
	autoBlink: boolean
	x: number
	y: number
	scale: number
}
const DEFAULT_OPTION: Live2dRendererOption = {
	autoBlink: true,
	x: 0,
	y: 0,
	scale: 1,
}

let isFrameworkInitialized = false;

export async function live2dRender(canvas: HTMLCanvasElement, _model: ArrayBuffer, buffers: AvatarArrayBuffers, options: Partial<Live2dRendererOption> = {}) {
	/**
	 * WebGLコンテキストの初期化
	 */

	const gl = canvas.getContext('webgl')
	if (gl === null) throw new Error('WebGL未対応のブラウザです。')

	gl.enable(gl.BLEND)
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
	gl.clearColor(0.0, 0.0, 0.0, 0.0)
	gl.enable(gl.DEPTH_TEST)
	gl.depthFunc(gl.LEQUAL)

	const option = Object.assign({}, DEFAULT_OPTION, options)

	// フレームバッファを用意
	const frameBuffer: WebGLFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING)

	/**
	 * Frameworkの初期化
	 */
	if (!isFrameworkInitialized) {
		CubismFramework.startUp()
		CubismFramework.initialize()
		isFrameworkInitialized = true;
	}

	const modelSetting = new CubismModelSettingJson(_model, _model.byteLength) as ICubismModelSetting

	const {
		moc3: moc3ArrayBuffer,
		textures,
		physics: physics3ArrayBuffer
	} = buffers
	/**
	 * Live2Dモデルの作成と設定
	 */

	const model = new AppCubismUserModel()
	// モデルデータをロード
	model.loadModel(moc3ArrayBuffer)
	// レンダラの作成（bindTextureより先にやっておく）
	model.createRenderer()
	// テクスチャをレンダラに設定
	let i = 0
	for (let buffer of textures) {
		const texture = await createTexture(buffer, gl)
		model.getRenderer()
			.bindTexture(i, texture)
		i++
	}
	// そのほかレンダラの設定
	model.getRenderer().setIsPremultipliedAlpha(true)
	model.getRenderer().startUp(gl)

	// 自動目ぱち設定
	if (option.autoBlink) {
		model.setEyeBlink(CubismEyeBlink.create(modelSetting))
	}

	// モーションに適用する目ぱち用IDを設定
	for (let i = 0, len = modelSetting.getEyeBlinkParameterCount(); i < len; i++) {
		model.addEyeBlinkParameterId(modelSetting.getEyeBlinkParameterId(i))
	}
	// モーションに適用する口パク用IDを設定
	for (let i = 0, len = modelSetting.getLipSyncParameterCount(); i < len; i++) {
		model.addLipSyncParameterId(modelSetting.getLipSyncParameterId(i))
	}
	// 物理演算設定
	model.loadPhysics(physics3ArrayBuffer, physics3ArrayBuffer.byteLength)
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
	})
	const projectionMatrix = new CubismMatrix44()
	const resizeModel = () => {
		canvas.width = canvas.clientWidth * devicePixelRatio
		canvas.height = canvas.clientHeight * devicePixelRatio

		// NOTE: modelMatrixは、モデルのユニット単位での幅と高さが1×1に収まるように縮めようとしている？
		const modelMatrix = model.getModelMatrix()
		modelMatrix.bottom(0)
		modelMatrix.centerY(-1)
		modelMatrix.translateY(-1)
		projectionMatrix.loadIdentity()
		const canvasRatio = canvas.height / canvas.width
		if (1 < canvasRatio) {
			// モデルが横にはみ出る時は、HTMLキャンバスの幅で合わせる
			modelMatrix.scale(1, canvas.width / canvas.height)
		} else {
			// モデルが上にはみ出る時は、HTMLキャンバスの高さで合わせる（スマホのランドスケープモードとか）
			modelMatrix.scale(canvas.height / canvas.width, 1)
		}
		modelMatrix.translateRelative(defaultPosition.x, defaultPosition.y)
		// モデルが良い感じの大きさになるように拡大・縮小
		projectionMatrix.multiplyByMatrix(modelMatrix)
		const scale = defaultPosition.z
		projectionMatrix.scaleRelative(scale, scale)
		model.getRenderer().setMvpMatrix(projectionMatrix)

	}
	resizeModel()

	/**
	 * Live2Dモデルの描画
	 */

		// フレームバッファとビューポートを、フレームワーク設定
	const viewport: number[] = [
			0,
			0,
			canvas.width,
			canvas.height
		]

	// 最後の更新時間
	let lastUpdateTime = Date.now()
	let point = new FacePoint()

	const loop = () => {
		const time = Date.now()
		// 最後の更新からの経過時間を秒で求める
		const deltaTimeSecond = (time - lastUpdateTime) / 1000

		// モデルの位置調整
		const _model = model.getModel()
		const idManager = CubismFramework.getIdManager()

		_model.setParameterValueById(idManager.getId('ParamAngleX'), point.angleX, .5)
		_model.setParameterValueById(idManager.getId('ParamAngleY'), point.angleY, .5)
		_model.setParameterValueById(idManager.getId('ParamAngleZ'), point.angleZ, .5)
		_model.setParameterValueById(idManager.getId('ParamEyeBallX'), point.angleEyeX, .5)
		_model.setParameterValueById(idManager.getId('ParamEyeBallY'), point.angleEyeY, .5)
		_model.setParameterValueById(idManager.getId('ParamMouthOpenY'), point.mouseDistance * 0.1, .5)
		_model.setParameterValueById(idManager.getId('ParamBodyAngleZ'), point.angleZ / 2, .05)
		_model.saveParameters()
		// 頂点の更新
		model.update(deltaTimeSecond)

		if (model.isMotionFinished) {
		
			const idx = Math.floor(Math.random() * model.motionNames.length);
			const name = model.motionNames[idx];
			model.startMotionByName(name);
		}

		viewport[2] = canvas.width
		viewport[3] = canvas.height
		model.getRenderer().setRenderState(frameBuffer, viewport)

		// モデルの描画
		model.getRenderer().drawModel()

		lastUpdateTime = time

		// TODO: cancelできる仕組みを提供する
		requestAnimationFrame(loop)
	}

	window.addEventListener('resize', () => {
		resizeModel()
		loop()
	})
	loop()

	return {
		updatePoint(newPoint: Partial<FacePoint>) {
			Object.assign(point, newPoint)
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
		const url = URL.createObjectURL(blob)
		const img: HTMLImageElement = new Image()
		img.onload = () => {
			const tex: WebGLTexture = gl.createTexture() as WebGLTexture

			// テクスチャを選択
			gl.bindTexture(gl.TEXTURE_2D, tex)

			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

			// 乗算済みアルファ方式を使用する
			gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1)

			// テクスチャにピクセルを書き込む
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)

			// ミップマップを生成
			gl.generateMipmap(gl.TEXTURE_2D)
			URL.revokeObjectURL(url)
			return resolve(tex)
		}
		img.addEventListener('error',() => {
			console.error(`image load error`)
		})
		img.src = url

	})

}
