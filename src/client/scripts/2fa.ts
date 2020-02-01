export function hexifyAB(buffer) {
	return Array.from(new Uint8Array(buffer))
		.map(item => item.toString(16).padStart(2, '0'))
		.join('');
}
