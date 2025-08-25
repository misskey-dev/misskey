import type { Directive } from 'vue';

let initialized = false;
let styleEl: HTMLStyleElement | null = null;
const canUseDeviceOrientation = !!window.DeviceOrientationEvent;
const className = '_flipOnDeviceOrientation';
const variableName = `--MI-flip_on_device_orientation_transform`;

function handleOrientationChange(event: DeviceOrientationEvent) {
	const isUpsideDown = event.beta ? event.beta < 5 : false;
	const transform = isUpsideDown ? 'scale(-1, -1)' : '';
	window.document.documentElement.style.setProperty(variableName, transform);
}

function registerListener() {
	if (!canUseDeviceOrientation) return;

	if (!initialized) {
		window.addEventListener('deviceorientation', handleOrientationChange);
		if (!styleEl) {
			styleEl = window.document.createElement('style');
			styleEl.textContent = `.${className} { transform: var(${variableName}); }`;
			window.document.head.appendChild(styleEl);
		}
		initialized = true;
	} else if (window.document.getElementsByClassName(className).length === 0) {
		window.removeEventListener('deviceorientation', handleOrientationChange);
		if (styleEl) {
			window.document.head.removeChild(styleEl);
			styleEl = null;
		}
		initialized = false;
	}
}

export default {
	mounted(el) {
		registerListener();
		el.classList.add(className);
	},
	unmounted(el) {
		el.classList.remove(className);
		registerListener();
	},
} as Directive;
