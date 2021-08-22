import { FacePoint } from './face-point';
import { Live2dRenderer } from './renderer';
import { getAngle, getDistance } from './math-util';

const MODEL_FILES = {
	moc3: '/assets/live2d/Ai/ai.moc3',
	model3: '/assets/live2d/Ai/ai.model3.json',
	physics3: '/assets/live2d/Ai/ai.physics3.json',
	textures: [
		'/assets/live2d/Ai/ai.4096/texture_00.png',
	],
	expressions: {
		test: '/assets/live2d/Ai/expressions/exp_01.exp3.json',
		gurugurume: '/assets/live2d/Ai/expressions/exp_20.exp3.json',
	},
};

export function load(canvas: HTMLCanvasElement, options: { x?: number; y?: number; scale?: number; }) {
	return new Promise((res, rej) => {
		const coreSdkScript = document.createElement('script');
		coreSdkScript.setAttribute('src', '/assets/lib/CubismCore/live2dcubismcore.js');
		document.head.appendChild(coreSdkScript);
		coreSdkScript.addEventListener('load', () => {
			main(canvas, options).then(renderer => {
				res(renderer);
			});
		});
	});
}

async function main(canvas: HTMLCanvasElement, options: { x?: number; y?: number; scale?: number; }) {
	try {
		const [model, moc3, physics, textures, expressions] = await Promise.all([
			fetch(MODEL_FILES.model3).then(res => res.arrayBuffer()),
			fetch(MODEL_FILES.moc3).then(res => res.arrayBuffer()),
			fetch(MODEL_FILES.physics3).then(res => res.arrayBuffer()),
			Promise.all(MODEL_FILES.textures.map(texture =>
				fetch(texture).then(res => res.blob())
			)),
			Promise.all(Object.entries(MODEL_FILES.expressions).map(([k, v]) =>
				fetch(v).then(res => res.arrayBuffer()).then(buffer => [k, buffer])
			)),
		]);
		const renderer = new Live2dRenderer(canvas);
		await renderer.init(model, {
			moc3,
			physics,
			textures,
			expressions,
		}, {
			autoBlink: true,
			x: 0,
			y: 1.4,
			scale: 2,
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
