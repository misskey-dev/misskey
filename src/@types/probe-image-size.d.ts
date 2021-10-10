declare module 'probe-image-size' {
	import { Readable } from 'stream';

	type ProbeOptions = {
		retries: 1;
		timeout: 30000;
	};

	type ProbeResult = {
		width: number;
		height: number;
		length?: number;
		type: string;
		mime: string;
		wUnits: 'in' | 'mm' | 'cm' | 'pt' | 'pc' | 'px' | 'em' | 'ex';
		hUnits: 'in' | 'mm' | 'cm' | 'pt' | 'pc' | 'px' | 'em' | 'ex';
		url?: string;
	};

	function probeImageSize(src: string | Readable, options?: ProbeOptions): Promise<ProbeResult>;
	function probeImageSize(src: string | Readable, callback: (err: Error | null, result?: ProbeResult) => void): void;
	function probeImageSize(src: string | Readable, options: ProbeOptions, callback: (err: Error | null, result?: ProbeResult) => void): void;

	namespace probeImageSize {} // Hack

	export = probeImageSize;
}
