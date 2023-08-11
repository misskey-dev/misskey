import { aidRegExp, genAid, parseAid } from '@/misc/id/aid.js';
import { genMeid, meidRegExp, parseMeid } from '@/misc/id/meid.js';
import { genMeidg, meidgRegExp, parseMeidg } from '@/misc/id/meidg.js';
import { genObjectId, objectIdRegExp, parseObjectId } from '@/misc/id/object-id.js';
import { ulidRegExp, parseUlid } from '@/misc/id/ulid.js';
import { ulid } from 'ulid';
import { describe, test, expect } from '@jest/globals';

describe('misc:id', () => {
    test('aid', () => {
        const date = new Date();
        const gotAid = genAid(date);
        expect(gotAid).toMatch(aidRegExp);
        expect(parseAid(gotAid).date.getTime()).toBe(date.getTime());
    });

    test('meid', () => {
        const date = new Date();
        const gotMeid = genMeid(date);
        expect(gotMeid).toMatch(meidRegExp);
        expect(parseMeid(gotMeid).date.getTime()).toBe(date.getTime());
    });

    test('meidg', () => {
        const date = new Date();
        const gotMeidg = genMeidg(date);
        expect(gotMeidg).toMatch(meidgRegExp);
        expect(parseMeidg(gotMeidg).date.getTime()).toBe(date.getTime());
    });

    test('objectid', () => {
        const date = new Date();
        const gotObjectId = genObjectId(date);
        expect(gotObjectId).toMatch(objectIdRegExp);
        expect(Math.floor(parseObjectId(gotObjectId).date.getTime() / 1000)).toBe(Math.floor(date.getTime() / 1000));
    });

    test('ulid', () => {
        const date = new Date();
        const gotUlid = ulid(date.getTime());
        expect(gotUlid).toMatch(ulidRegExp);
        expect(parseUlid(gotUlid).date.getTime()).toBe(date.getTime());
    });
});
