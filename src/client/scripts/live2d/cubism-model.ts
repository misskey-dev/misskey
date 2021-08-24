import {
	CubismUserModel,
	ACubismMotion,
	CsmVector,
	CubismIdHandle,
	CubismEyeBlink
} from './live2d-sdk';

interface MotionResources {
	[name: string]: ACubismMotion;
}

export default class AppCubismUserModel extends CubismUserModel {
	private motionResources: MotionResources;
	private expressionResources: MotionResources;
	private lipSyncParamIds = new CsmVector<CubismIdHandle>();
	private eyeBlinkParamIds = new CsmVector<CubismIdHandle>();

	constructor() {
		super();
		this.motionResources = {};
		this.expressionResources = {};
		this.lipSyncParamIds = new CsmVector<CubismIdHandle>();
		this.eyeBlinkParamIds = new CsmVector<CubismIdHandle>();
		this._lipsync = false;

	}

	/**
	 * 自動目ぱちを設定
	 * @param eyeBlink
	 */
	public setEyeBlink(eyeBlink: CubismEyeBlink) {
		this._eyeBlink = eyeBlink;
	}

	/**
	 * モーション更新時に置き換える目ぱち用IDを追加
	 * @param id 目ぱち用ID
	 */
	public addEyeBlinkParameterId(id: CubismIdHandle) {
		this.eyeBlinkParamIds.pushBack(id);
	}

	/**
	 * モーション更新時に置き換える口パク用IDを追加
	 * @param id 口パク用ID
	 */
	public addLipSyncParameterId(id: CubismIdHandle) {
		this.lipSyncParamIds.pushBack(id);
	}

	/**
	 * モーションを追加して、ID（インデックス）を返す
	 * @param buffer モーションデータ
	 * @param name モーション名
	 */
	public addMotion(buffer: ArrayBuffer, name: string, fadeIn: number = 1, fadeOut: number = 1): string {
		const motion = this.loadMotion(buffer, buffer.byteLength, name);
		if (fadeIn > 0) motion.setFadeInTime(fadeIn);
		if (fadeOut > 0) motion.setFadeOutTime(fadeOut);

		motion.setEffectIds(this.eyeBlinkParamIds, this.lipSyncParamIds);

		this.motionResources[name] = motion;

		return name;
	}

	/**
	 * 表情を追加して、ID（インデックス）を返す
	 * @param buffer 表情データ
	 * @param name 表情名
	 */
	public addExpression(buffer: ArrayBuffer, name: string, fadeIn: number = 1, fadeOut: number = 1): string {
		const expression = this.loadExpression(buffer, buffer.byteLength, name);
		if (fadeIn > 0) expression.setFadeInTime(fadeIn);
		if (fadeOut > 0) expression.setFadeOutTime(fadeOut);

		this.expressionResources[name] = expression;

		return name;
	}

	/**
	 * 登録されているモーションのIDと名前のリストを返す
	 */
	public get motionNames(): string[] {
		return Object.keys(this.motionResources);
	}

	/**
	 * モーションの再生が終わっているかどうか
	 */
	public get isMotionFinished(): boolean {
		return this._motionManager.isFinished();
	}

	/**
	 * モーションの名前を指定して再生する
	 * @param name モーション名
	 */
	public startMotionByName(name: string) {
		const motion = this.motionResources[name];
		if (!motion) return;
		this._motionManager.startMotionPriority(motion, false, 0);
	}

	/**
	 * 表情の名前を指定して再生する
	 * @param name 表情名
	 */
	public startExpressionByName(name: string) {
		const expression = this.expressionResources[name];
		if (!expression) return;
		this._expressionManager.startMotionPriority(expression, false, 1);
	}

	/**
	 * モデルのパラメータを更新する
	 */
	public update(deltaTimeSecond: number) {
		this.getModel().loadParameters();

		// モデルのパラメータを更新
		const motionUpdated = this._motionManager.updateMotion(this.getModel(), deltaTimeSecond);
		const expressionUpdated = this._expressionManager.updateMotion(this.getModel(), deltaTimeSecond);

		this.getModel().saveParameters();

		// まばたき
		if (!motionUpdated && !expressionUpdated && this._eyeBlink != null) {
			this._eyeBlink.updateParameters(this._model, deltaTimeSecond);
		}

		// ポーズ
		if(this._pose !== null) {
			this._pose.updateParameters(this._model, 0);
		}
		// 物理演算
		if(this._physics != null) {
			this._physics.evaluate(this._model, deltaTimeSecond);
		}
		this._model.update();
	}
}
