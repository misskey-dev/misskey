import * as fs from 'fs';
import * as path from 'path';
import {IActivity} from '@/remote/activitypub/type';

// Return true to continue pipeline, false to reject
export type MRF = (data: {
	activity: any
}) => boolean;

const dir = `${__dirname}/../../.config/mrf`;
const mrfs: MRF[] = [];

if (fs.existsSync(dir)) {
	if (fs.statSync(dir).isDirectory()) {
		const files = fs.readdirSync(dir).filter(v => v.endsWith('.js')).sort().map(v => path.join(dir, v));
		for (const v of files) {
			try {
				const mrf = require(v);
				if (typeof(mrf) !== 'function') continue;
				mrfs.push(mrf);
			} catch (e) {}
		}
	}
}

export default mrfs;
