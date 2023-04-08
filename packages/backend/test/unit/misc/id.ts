import { genAid, parseAid } from '@/misc/id/aid';
import { genMeid, parseMeid } from '@/misc/id/meid';
import { describe, test, expect } from '@jest/globals';

describe('misc:id', () => {
    test('aid', () => {
        const date = new Date();
        const aid = genAid(date);
        expect(aid).toMatch(/^[0-9a-z]{10}$/);
        expect(parseAid(aid).date.getTime()).toBe(date.getTime());
    });

    test('meid', () => {
        const date = new Date();
        const meid = genMeid(date);
        expect(meid).toMatch(/^[0-9a-f]{24}$/);
        expect(parseMeid(meid).date.getTime()).toBe(date.getTime());
    });
});
