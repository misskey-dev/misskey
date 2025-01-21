<template>
<div ref="container" :class="$style.root">
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, shallowRef, nextTick, ref } from 'vue';
import * as Misskey from 'misskey-js';
import * as THREE from 'three';
import vertexShader from '../../node_modules/webgl-audiovisualizer/audiovisial-vertex.shader?raw';
import fragmentShader from '../../node_modules/webgl-audiovisualizer/audiovisial-fragment.shader?raw';
import circleMask from '../../node_modules/webgl-audiovisualizer/circlemask.png';

const props = defineProps<{
	user: Misskey.entities.UserLite;
	audioEl: HTMLAudioElement | undefined;
	analyser: AnalyserNode | undefined;
}>();

const container = shallowRef<HTMLDivElement>();

const isPlaying = ref(false);
const fftSize = 2048;

let prevTime = 0;
let angle1 = 0;
let angle2 = 0;

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera();
const renderer = new THREE.WebGLRenderer({ antialias: true });

let width: number;
let height: number;
let uniforms: { [p: string]: THREE.IUniform };
let texture: THREE.Texture;
let maskTexture: THREE.Texture;
let dataArray1: Uint8Array;
let dataArray2: Uint8Array;
let dataArrayOrigin: Uint8Array;
let bufferLength: number;

const init = () => {
	const parent = container.value ?? { offsetWidth: 0 };
	width = parent.offsetWidth;
	height = Math.floor(width * 9 / 16);

	scene.clear();
	camera.clear();

	camera.left = width / -2;
	camera.right = width / 2;
	camera.top = height / 2;
	camera.bottom = height / -2;
	camera.updateProjectionMatrix();

	renderer.setSize(width, height);

	if (container.value) {
		container.value.appendChild(renderer.domElement);
	}

	const loader = new THREE.TextureLoader();
	texture = loader.load(props.user.avatarUrl ?? '');
	maskTexture = loader.load(circleMask);
	uniforms = {
		enableAudio: {
			value: 0,
		},
		uTex: { value: texture },
		uMask: { value: maskTexture },
		time: {
			value: 0,
		},
		resolution: {
			value: new THREE.Vector2(width, height),
		},
	};

	const material = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: vertexShader,
		fragmentShader: fragmentShader,
	});

	const geometry = new THREE.PlaneGeometry(2, 2);

	const mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);

	renderer.setAnimationLoop(animate);
};

const play = () => {
	if (props.analyser) {
		bufferLength = props.analyser.frequencyBinCount;
		dataArrayOrigin = new Uint8Array(bufferLength);
		dataArray1 = new Uint8Array(bufferLength);
		dataArray2 = new Uint8Array(bufferLength);
		uniforms = {
			enableAudio: {
				value: 1,
			},
			tAudioData1: { value: new THREE.DataTexture(dataArray1, fftSize / 2, 1, THREE.RedFormat) },
			tAudioData2: { value: new THREE.DataTexture(dataArray2, fftSize / 2, 1, THREE.RedFormat) },
			uTex: { value: texture },
			uMask: { value: maskTexture },
			time: {
				value: 0,
			},
			resolution: {
				value: new THREE.Vector2(width, height),
			},
		};
		const material = new THREE.ShaderMaterial({
			uniforms: uniforms,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
		});

		const geometry = new THREE.PlaneGeometry(2, 2);

		const mesh = new THREE.Mesh(geometry, material);
		scene.add(mesh);

		renderer.setAnimationLoop(animate);
	}
};

const pauseAnimation = () => {
	isPlaying.value = false;
};

const resumeAnimation = () => {
	isPlaying.value = true;
	renderer.setAnimationLoop(play);
};

const animate = (time) => {
	if (angle1 >= bufferLength) {
		angle1 = 0;
	}
	if (angle2 >= bufferLength) {
		angle2 = 0;
	}

	if (props.analyser) {
		if ((time - prevTime) > 10) {
			for (let i = 0; i < bufferLength; i++) {
				let n1 = (i + angle1) % bufferLength;
				let n2 = (i + angle2) % bufferLength;
				if (dataArrayOrigin[n1] > dataArray1[i]) {
					dataArray1[i] = dataArray1[i] < 255 ? (dataArrayOrigin[i] + dataArray1[i]) / 2 : 255;
				}
				if (dataArrayOrigin[n2] > dataArray2[i]) {
					dataArray2[i] = dataArray2[i] < 255 ? (dataArrayOrigin[i] + dataArray2[i]) / 2 : 255;
				}
			}
		}
		if ((time - prevTime) > 20) {
			for (let i = 0; i < bufferLength; i++) {
				let n1 = (i + angle1) % bufferLength;
				let n2 = (i + angle2) % bufferLength;
				if (dataArrayOrigin[n1] < dataArray1[i]) {
					dataArray1[i] = dataArray1[i] > 0 ? dataArray1[i] - 1 : 0;
				}
				if (dataArrayOrigin[n2] < dataArray2[i]) {
					dataArray2[i] = dataArray2[i] > 0 ? dataArray2[i] - 1 : 0;
				}
			}
			uniforms.tAudioData1.value.needsUpdate = true;
			uniforms.tAudioData2.value.needsUpdate = true;
			prevTime = time;
		}

		if (isPlaying.value) {
			props.analyser.getByteTimeDomainData(dataArrayOrigin);
		} else {
			for (let i = 0; i < bufferLength; i++) {
				dataArrayOrigin[i] = 0;
			}
		}

		angle1 += parseInt(String(bufferLength / 360 * 2)); //こうしないと型エラー出てうざい
		angle2 += parseInt(String(bufferLength / 360 * 3));
	}
	uniforms.time.value = time;
	renderer.render(scene, camera);
};

const resize = () => {
	const parent = container.value ?? { offsetWidth: 0 };
	width = parent.offsetWidth;
	height = Math.floor(width * 9 / 16);
	camera.left = width / -2;
	camera.right = width / 2;
	camera.top = height / 2;
	camera.bottom = height / -2;
	camera.updateProjectionMatrix();
	renderer.setSize(width, height);
	uniforms.resolution.value.set(width, height);
};

const ro = new ResizeObserver((entries, observer) => {
	resize();
});

onMounted(async () => {
	nextTick().then(() => {
		init();
		resize();
	});

	if (!container.value) return;
	ro.observe(container.value);
});

onUnmounted(() => {
	if (renderer) {
		renderer.dispose();
	}
	ro.disconnect();
});

defineExpose({
	pauseAnimation,
	resumeAnimation,
});

</script>

<style lang="scss" module>
.root {
	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;
}
</style>
