import { FacePoint } from './face-point';
import { Live2dRenderer } from './renderer';
import { getAngle, getDistance } from './math-util';

const MODEL_PATH = '/assets/live2d/ai/web/';
const MODEL_FILES = {
	moc3: MODEL_PATH + 'ai.moc3',
	model3: MODEL_PATH + 'ai.model3.json',
	physics3: MODEL_PATH + 'ai.physics3.json',
	textures: [
		MODEL_PATH + 'ai.4096/texture_00.png',
	],
	expressions: {
		smile: MODEL_PATH + 'expressions/exp_01.exp3.json',
		surprise: MODEL_PATH + 'expressions/exp_02.exp3.json',
		happy: MODEL_PATH + 'expressions/exp_06.exp3.json',
		jitome: MODEL_PATH + 'expressions/exp_11.exp3.json',
		gurugurume: MODEL_PATH + 'expressions/exp_20.exp3.json',
	},
	motions: {
		swing: MODEL_PATH + 'motions/mtn_03.motion3.json',
		mimi: MODEL_PATH + 'motions/mtn_05.motion3.json',
		AiArt: MODEL_PATH + 'motions/AiArt.motion3.json',
	},
};

let isCoreSdkLoaded = false;

export function load(canvas: HTMLCanvasElement, options: { x?: number; y?: number; scale?: number; }) {
	return new Promise((res, rej) => {
		const existedCoreSdkScript = document.head.querySelector('script[src="/assets/lib/CubismCore/live2dcubismcore.min.js"]');
		if (existedCoreSdkScript) {
			if (!isCoreSdkLoaded) {
				existedCoreSdkScript.addEventListener('load', () => {
					main(canvas, options).then(renderer => {
						res(renderer);
					});
				});
			} else {
				main(canvas, options).then(renderer => {
					res(renderer);
				});
			}
		} else {
			const coreSdkScript = document.createElement('script');
			coreSdkScript.setAttribute('src', '/assets/lib/CubismCore/live2dcubismcore.min.js');
			document.head.appendChild(coreSdkScript);
			coreSdkScript.addEventListener('load', () => {
				isCoreSdkLoaded = true;
				main(canvas, options).then(renderer => {
					res(renderer);
				});
			});
		}
	});
}

async function main(canvas: HTMLCanvasElement, options: { x: number; y: number; scale: number; }) {
	try {
		const [model, moc3, physics, textures, expressions, motions] = await Promise.all([
			fetch(MODEL_FILES.model3).then(res => res.arrayBuffer()),
			fetch(MODEL_FILES.moc3).then(res => res.arrayBuffer()),
			fetch(MODEL_FILES.physics3).then(res => res.arrayBuffer()),
			Promise.all(MODEL_FILES.textures.map(texture =>
				fetch(texture).then(res => res.blob())
			)),
			Promise.all(Object.entries(MODEL_FILES.expressions).map(([k, v]) =>
				fetch(v).then(res => res.arrayBuffer()).then(buffer => [k, buffer])
			)),
			Promise.all(Object.entries(MODEL_FILES.motions).map(([k, v]) =>
				fetch(v).then(res => res.arrayBuffer()).then(buffer => [k, buffer])
			)),
		]);
		const renderer = new Live2dRenderer(canvas);
		await renderer.init(model, {
			moc3,
			physics,
			textures,
			expressions,
			motions,
		}, {
			autoBlink: true,
			...options
		});
		let point = new FacePoint();
		const _handleOnMouseMove = (e: MouseEvent) => {
			const x = e.clientX;
			const y = e.clientY;
			const rect = canvas.getBoundingClientRect();
			const cx = rect.left + rect.width / 2;
			const cy = rect.top + rect.height / 2;
			const distance = getDistance(x, y, cx, cy);
			const dx = cx - x;
			const dy = cy - y;
			const angle = getAngle(x, y, cx, cy);
			const r = Math.cos(angle) * Math.sin(angle) * 180 / Math.PI;
			Object.assign(point, {
				angleX: -dx / 10,
				angleY: dy / 10,
				angleZ: r * (distance / cx),
				angleEyeX: -dx / cx,
				angleEyeY: dy / cy,
			});
			renderer.updatePoint(point);
		};
		// TODO: disposeできるような仕組みを提供する
		document.body.addEventListener('mousemove', _handleOnMouseMove, false);

		return renderer;
	} catch(e) {
		alert(e.message);
		console.error(e);
	}
}
