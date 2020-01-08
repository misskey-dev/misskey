declare module 'probe-image-size' {
	import { ReadStream } from 'fs';

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

	function probeImageSize(src: string | ReadStream, options?: ProbeOptions, callback?: Function): Promise<ProbeResult>;

	namespace probeImageSize {} // Hack

	export = probeImageSize;
}
