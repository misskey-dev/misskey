export function byteify(data: string, encoding: 'ascii' | 'base64' | 'hex') {
	switch (encoding) {
		case 'ascii':
			return Uint8Array.from(data, c => c.charCodeAt(0));
		case 'base64':
			return Uint8Array.from(
				atob(
					data
						.replace(/-/g, '+')
						.replace(/_/g, '/')
				),
				c => c.charCodeAt(0)
			);
		case 'hex':
			return new Uint8Array(
				data
					.match(/.{1,2}/g)
					.map(byte => parseInt(byte, 16))
			);
	}
}

export function hexify(buffer: ArrayBuffer) {
	return Array.from(new Uint8Array(buffer))
		.reduce(
			(str, byte) => str + byte.toString(16).padStart(2, '0'),
			''
		);
}

export function stringify(buffer: ArrayBuffer) {
	return String.fromCharCode(... new Uint8Array(buffer));
}
