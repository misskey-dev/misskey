/**
 * Unit testing TypeScript types.
 * with https://github.com/SamVerschueren/tsd
 */

import { expectType } from 'tsd';
import * as Misskey from '../src';

describe('API', () => {
	test('returns node that has sprcified type', async () => {
		const res = await Misskey.api.request('https://misskey.test', 'meta', { detail: true }, 'TOKEN');
		expectType<Misskey.entities.InstanceMetadata>(res);
	});
});
