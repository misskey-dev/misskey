import { describe, test, expect } from '@jest/globals';
import { contentDisposition } from '@/misc/content-disposition.js';
import { correctFilename } from '@/misc/correct-filename.js';

describe('misc:content-disposition', () => {
    test('inline', () => {
        expect(contentDisposition('inline', 'foo bar')).toBe('inline; filename=\"foo_bar\"; filename*=UTF-8\'\'foo%20bar');
    });
    test('attachment', () => {
        expect(contentDisposition('attachment', 'foo bar')).toBe('attachment; filename=\"foo_bar\"; filename*=UTF-8\'\'foo%20bar');
    });
    test('non ascii', () => {
        expect(contentDisposition('attachment', 'ファイル名')).toBe('attachment; filename=\"_____\"; filename*=UTF-8\'\'%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E5%90%8D');
    });
});

describe('misc:correct-filename', () => {
    test('simple', () => {
        expect(correctFilename('filename', 'jpg')).toBe('filename.jpg');
    });
    test('with same ext', () => {
        expect(correctFilename('filename.jpg', 'jpg')).toBe('filename.jpg');
    });
    test('.ext', () => {
        expect(correctFilename('filename.jpg', '.jpg')).toBe('filename.jpg');
    });
    test('with different ext', () => {
        expect(correctFilename('filename.webp', 'jpg')).toBe('filename.webp.jpg');
    });
    test('non ascii with space', () => {
        expect(correctFilename('ファイル 名前', 'jpg')).toBe('ファイル 名前.jpg');
    });
    test('jpeg', () => {
        expect(correctFilename('filename.jpeg', 'jpg')).toBe('filename.jpeg');
    });
    test('tiff', () => {
        expect(correctFilename('filename.tiff', 'tif')).toBe('filename.tiff');
    });
    test('null ext', () => {
        expect(correctFilename('filename', null)).toBe('filename.unknown');
    });
});
