// Crockford's Base32
// https://github.com/ulid/spec#encoding
const CHARS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export const ulidRegExp = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/;

export function parseUlid(id: string): { date: Date; } {
    const timestamp = id.slice(0, 10);
    let time = 0;
    for (let i = 0; i < 10; i++) {
        time = time * 32 + CHARS.indexOf(timestamp[i]);
    }
    return { date: new Date(time) };
}
