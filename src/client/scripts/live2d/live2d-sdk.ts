import { Live2DCubismFramework } from '@lib/CubismWebFramework/src/live2dcubismframework';
const CubismFramework = Live2DCubismFramework.CubismFramework;

import { Live2DCubismFramework as icubismmodelsetting } from '@lib/CubismWebFramework/src/icubismmodelsetting';
abstract class ICubismModelSetting extends icubismmodelsetting.ICubismModelSetting {}

import { Live2DCubismFramework as cubismmodelsettingjson } from '@lib/CubismWebFramework/src/cubismmodelsettingjson';
class CubismModelSettingJson extends cubismmodelsettingjson.CubismModelSettingJson {}

// math
import { Live2DCubismFramework as cubismmatrix44 } from '@lib/CubismWebFramework/src/math/cubismmatrix44';
class CubismMatrix44 extends cubismmatrix44.CubismMatrix44 {}

import { Live2DCubismFramework as cubismusermodel } from '@lib/CubismWebFramework/src/model/cubismusermodel';
class CubismUserModel extends cubismusermodel.CubismUserModel {}

// motion
import { Live2DCubismFramework as acubismmotion } from '@lib/CubismWebFramework/src/motion/acubismmotion';
abstract class ACubismMotion extends acubismmotion.ACubismMotion {}

import { Live2DCubismFramework as cubismmotion } from '@lib/CubismWebFramework/src/motion/cubismmotion'
class CubismMotion extends cubismmotion.CubismMotion {}

import { Live2DCubismFramework as cubismexpressionmotion } from '@lib/CubismWebFramework/src/motion/cubismexpressionmotion';
class CubismExpressionMotion extends cubismexpressionmotion.CubismExpressionMotion {}

import { Live2DCubismFramework as cubismmotionmanager } from '@lib/CubismWebFramework/src/motion/cubismmotionmanager';
class CubismMotionManager extends cubismmotionmanager.CubismMotionManager {}

// physics
import { Live2DCubismFramework as cubismphysics } from '@lib/CubismWebFramework/src/physics/cubismphysics';
class CubismPhysics extends cubismphysics.CubismPhysics {}

// cubismid
import { Live2DCubismFramework as cubismid } from '@lib/CubismWebFramework/src/id/cubismid';
type CubismIdHandle = cubismid.CubismIdHandle;

// effect
import { Live2DCubismFramework as cubismeyeblink } from '@lib/CubismWebFramework/src/effect/cubismeyeblink';
class CubismEyeBlink extends cubismeyeblink.CubismEyeBlink {}

// type
import { Live2DCubismFramework as csmvector } from '@lib/CubismWebFramework/src/type/csmvector';
class csmVector<T> extends csmvector.csmVector<T> {}

export {
	CubismFramework,
	ICubismModelSetting,
	CubismModelSettingJson,
	CubismMatrix44,
	CubismUserModel,
	ACubismMotion,
	CubismMotion,
	CubismExpressionMotion,
	CubismMotionManager,
	CubismPhysics,
	CubismEyeBlink,
	csmVector
};

export type {
	CubismIdHandle
};
