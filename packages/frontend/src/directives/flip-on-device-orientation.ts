import type { Directive } from 'vue';

let initialized = false;
let styleEl: HTMLStyleElement | null = null;
const elements = new Set<HTMLElement>();
const className = '_flipOnDeviceOrientation';
const variableName = `--flip_on_device_orientation_transform`;

function handleOrientationChange() {
	const isUpsideDown = window.screen.orientation.type === 'landscape-secondary';
	const transform = isUpsideDown ? 'scale(-1, -1)' : '';
	window.document.body.style.setProperty(variableName, transform);
}

function registerListener() {
	if (!initialized) {
		screen.orientation.addEventListener('change', handleOrientationChange);
		if (!styleEl) {
			styleEl = window.document.createElement('style');
			styleEl.textContent = `.${className} { transform: var(${variableName}); }`;
			window.document.head.appendChild(styleEl);
		}
		initialized = true;
	} else if (window.document.getElementsByClassName(className).length === 0) {
		screen.orientation.removeEventListener('change', handleOrientationChange);
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
		handleOrientationChange();
	},
	unmounted(el) {
		el.classList.remove(className);
		registerListener();
	},
} as Directive;
