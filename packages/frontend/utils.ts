const hash = (str: string, seed = 0): number => {
    let h1 = 0xdeadbeef ^ seed,
        h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }

    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

const BASE62_DIGITS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function toBase62(n: number): string {
    if (n === 0) {
        return '0';
    }
    let result = '';
    while (n > 0) {
        result = BASE62_DIGITS[n % BASE62_DIGITS.length] + result;
        n = Math.floor(n / BASE62_DIGITS.length);
    }

    return result;
}

export const generateScopedName = (name, filename, css):string => {
    if (process.env.NODE_ENV === 'production') {
        return 'x' + toBase62(hash(`${filename} ${name}`)).substring(0, 4);
    } else {
        return 'x' + toBase62(hash(`${filename} ${name}`)).substring(0, 4) + '-' + name;
    }
};
