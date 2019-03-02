import * as fs from 'fs';
import * as isSvg from 'is-svg';

export default function(path: string) {
	try {
		const size = fs.statSync(path).size;
		if (size > 1 * 1024 * 1024) return false;
		return isSvg(fs.readFileSync(path));
	} catch {
		return false;
	}
}
