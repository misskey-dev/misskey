/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/vue';
import { nextTick } from 'vue';
import { preferState } from '../setup.unit.js';
import MkLightboxItem from '@/components/MkLightbox.item.vue';
import type { Content } from '@/components/MkLightbox.item.vue';

const state = vi.hoisted(() => ({ touch: true, hidden: false }));
vi.mock('@/utility/touch.js', () => ({ get isTouchUsing() { return state.touch; } }));
vi.mock('@/utility/device-kind.js', () => ({ deviceKind: 'desktop' }));
vi.mock('@/utility/sensitive-file.js', () => ({
	shouldHideFileByDefault: () => state.hidden,
	canRevealFile: async () => true,
}));
vi.mock('@/os.js', () => ({ popupMenu: vi.fn() }));
vi.mock('@/utility/get-file-menu.js', () => ({ getFileMenu: () => [] }));
vi.mock('@/components/MkLightbox.item.controls.vue', () => ({ default: { template: '<div />' } }));
vi.mock('@/components/MkLightbox.item.fileinfo.vue', () => ({ default: { template: '<div />' } }));
vi.mock('@/components/MkBlurhash.vue', () => ({ default: { template: '<div />' } }));

function setup(content: Partial<Content> = {}) {
	const result = render(MkLightboxItem, {
		props: {
			content: { id: 'image', type: 'image', url: '/image.png', width: 200, height: 400, ...content },
			activated: true,
			pixelatedZoom: false,
		},
		global: { stubs: { MkLoading: true, MkCondensedLine: { template: '<span><slot /></span>' } } },
	});
	const root = result.container.firstElementChild as HTMLElement;
	const main = root.firstElementChild as HTMLElement;
	const transformer = main.firstElementChild as HTMLElement;
	main.setPointerCapture = vi.fn();
	main.releasePointerCapture = vi.fn();
	vi.spyOn(main, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 400, 400));
	const image = main.querySelector('img');
	if (image) vi.spyOn(image, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 400, 400));
	return { ...result, main, transformer, image };
}

function pointer(target: Element, type: string, x: number, y: number, pointerId = 1) {
	return fireEvent(target, new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId, pointerType: 'touch' }));
}

async function tap(main: HTMLElement, x: number, y: number, endX = x, endY = y) {
	await pointer(main.querySelector('img, video') ?? main, 'pointerdown', x, y);
	await pointer(main, 'pointerup', endX, endY);
	// Pointer capture can retarget the compatibility click to main.
	await fireEvent.click(main, { clientX: endX, clientY: endY });
}

function touchstart(main: HTMLElement, x: number, y: number) {
	return fireEvent(main, new TouchEvent('touchstart', {
		bubbles: true,
		touches: [{ clientX: x, clientY: y } as Touch],
	}));
}

beforeEach(() => {
	state.touch = true;
	state.hidden = false;
	preferState.useNativeUiForVideoAudioPlayer = false;
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe('Lightbox background taps', () => {
	test.each([
		[200, 400, 50, 200],
		[400, 200, 200, 50],
	])('closes outside a %s × %s image', async (width, height, x, y) => {
		const view = setup({ width, height });
		await tap(view.main, x, y);
		expect(view.emitted('close')).toHaveLength(1);
	});

	test.each([[200, 200], [100, 200], [300, 200]])('keeps taps inside or on the image boundary (%s, %s)', async (x, y) => {
		const view = setup();
		await tap(view.main, x, y);
		expect(view.emitted('close')).toBeUndefined();
	});

	test('prefers the loaded image dimensions over metadata', async () => {
		const view = setup({ width: 400, height: 200 });
		Object.defineProperties(view.image, { naturalWidth: { value: 200 }, naturalHeight: { value: 400 } });
		await tap(view.main, 50, 200);
		expect(view.emitted('close')).toHaveLength(1);
	});

	test('does not close when dimensions are unknown', async () => {
		const view = setup({ width: null, height: null });
		await tap(view.main, 50, 200);
		expect(view.emitted('close')).toBeUndefined();
	});

	test('uses the loaded thumbnail while the original image dimensions are unknown', async () => {
		const view = setup({ width: null, height: null, thumbnailUrl: '/thumbnail.png' });
		const thumbnail = view.main.querySelector('img')!;
		Object.defineProperties(thumbnail, { naturalWidth: { value: 200 }, naturalHeight: { value: 400 } });
		await fireEvent.load(thumbnail);
		await tap(view.main, 50, 200);
		expect(view.emitted('close')).toHaveLength(1);
	});

	test('requires the start and end to be outside the image', async () => {
		const view = setup();
		await tap(view.main, 99, 200, 101, 200);
		await tap(view.main, 101, 200, 99, 200);
		expect(view.emitted('close')).toBeUndefined();
	});

	test('resets zoom before closing and uses the transformed image bounds', async () => {
		const view = setup();
		await fireEvent.wheel(view.main, { deltaY: -1, clientX: 200, clientY: 200 });
		expect(view.transformer.style.transform).not.toContain('scale(1)');
		vi.mocked(view.image!.getBoundingClientRect).mockReturnValue(new DOMRect(-20, -20, 440, 440));
		await tap(view.main, 95, 200); // Inside the enlarged image, outside the original image.
		expect(view.transformer.style.transform).not.toContain('scale(1)');
		await tap(view.main, 50, 200);
		expect(view.emitted('close')).toBeUndefined();
		expect(view.transformer.style.transform).toContain('scale(1)');
		vi.mocked(view.image!.getBoundingClientRect).mockReturnValue(new DOMRect(0, 0, 400, 400));
		await tap(view.main, 50, 200);
		expect(view.emitted('close')).toHaveLength(1);
	});

	test('ignores a drag followed by a click', async () => {
		const view = setup();
		await pointer(view.main, 'pointerdown', 50, 200);
		await pointer(view.main, 'pointermove', 57, 200);
		await pointer(view.main, 'pointerup', 57, 200);
		await fireEvent.click(view.main, { clientX: 57, clientY: 200 });
		expect(view.emitted('close')).toBeUndefined();
	});

	test('uses the image bounds after zooming and panning', async () => {
		const view = setup();
		await fireEvent.wheel(view.main, { deltaY: -1, clientX: 200, clientY: 200 });
		vi.mocked(view.image!.getBoundingClientRect).mockReturnValue(new DOMRect(100, -20, 440, 440));
		await tap(view.main, 200, 200); // Outside the moved image, inside the original image.
		expect(view.transformer.style.transform).toContain('scale(1)');
		expect(view.emitted('close')).toBeUndefined();
	});

	test('does not close again on an additional compatibility click', async () => {
		const view = setup();
		await tap(view.main, 50, 200);
		await fireEvent.click(view.main, { clientX: 50, clientY: 200 });
		expect(view.emitted('close')).toHaveLength(1);
	});

	test('ignores multiple pointers even when neither moves', async () => {
		const view = setup();
		await pointer(view.main, 'pointerdown', 50, 200);
		await pointer(view.main, 'pointerdown', 55, 200, 2);
		await pointer(view.main, 'pointerup', 55, 200, 2);
		await pointer(view.main, 'pointerup', 50, 200);
		await fireEvent.click(view.main, { clientX: 50, clientY: 200 });
		expect(view.emitted('close')).toBeUndefined();
	});

	test.each(['pointercancel', 'touchcancel', 'contextmenu'])('clears the tap after %s and allows the next tap', async (type) => {
		const view = setup();
		await pointer(view.main, 'pointerdown', 50, 200);
		await fireEvent(view.main, new Event(type, { bubbles: true }));
		await fireEvent.click(view.main, { clientX: 50, clientY: 200 });
		expect(view.emitted('close')).toBeUndefined();
		await tap(view.main, 50, 200);
		expect(view.emitted('close')).toHaveLength(1);
	});

	test('preserves image double tap zoom and resets detection on a background touch', async () => {
		const view = setup();
		const now = vi.spyOn(Date.prototype, 'getTime');
		now.mockReturnValue(1000);
		await touchstart(view.main, 101, 200);
		now.mockReturnValue(1100);
		await touchstart(view.main, 99, 200);
		now.mockReturnValue(1200);
		await touchstart(view.main, 101, 200);
		expect(view.transformer.style.transform).toContain('scale(1)');
		now.mockReturnValue(1300);
		await touchstart(view.main, 101, 200);
		expect(view.transformer.style.transform).toContain('scale(2)');
	});

	test('preserves hidden image reveal after pointer capture', async () => {
		state.hidden = true;
		const view = setup({ file: {} as NonNullable<Content['file']> });
		const hidden = view.main.querySelector('[data-gallery-click-action="hidden"]')!;
		await pointer(hidden, 'pointerdown', 200, 200);
		await pointer(view.main, 'pointerup', 200, 200);
		await fireEvent.click(view.main, { clientX: 200, clientY: 200 });
		await nextTick();
		expect(view.main.querySelector('[data-gallery-click-action="hidden"]')).toBeNull();
		expect(view.emitted('close')).toBeUndefined();
	});

	test('preserves mouse clicks inside images', async () => {
		state.touch = false;
		const view = setup();
		await tap(view.main, 200, 200);
		expect(view.emitted('close')).toHaveLength(1);
	});

	test('does not close audio on background taps', async () => {
		const view = setup({ type: 'audio' });
		await tap(view.main, 50, 200);
		expect(view.emitted('close')).toBeUndefined();
	});

	test.each([true, false])('closes outside video with touch mode %s', async (touch) => {
		state.touch = touch;
		const view = setup({ type: 'video' });
		const video = view.main.querySelector('video')!;
		vi.spyOn(video, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 0, 200, 400));
		await tap(view.main, 50, 200);
		expect(view.emitted('close')).toHaveLength(1);
	});

	test('preserves video playback taps and requires both endpoints outside', async () => {
		const view = setup({ type: 'video' });
		const video = view.main.querySelector('video')!;
		vi.spyOn(video, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 0, 200, 400));
		const play = vi.spyOn(video, 'play').mockResolvedValue();
		await tap(view.main, 200, 200);
		expect(play).toHaveBeenCalledOnce();
		await tap(view.main, 99, 200, 101, 200);
		await tap(view.main, 101, 200, 99, 200);
		expect(view.emitted('close')).toBeUndefined();
	});

	test('waits for video metadata when dimensions are unknown', async () => {
		const view = setup({ type: 'video', width: null, height: null });
		const video = view.main.querySelector('video')!;
		vi.spyOn(video, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 0, 200, 400));
		vi.spyOn(video, 'play').mockResolvedValue();
		await tap(view.main, 50, 200);
		expect(view.emitted('close')).toBeUndefined();
		Object.defineProperties(video, { videoWidth: { value: 200 }, videoHeight: { value: 400 } });
		await fireEvent.loadedMetadata(video);
		await tap(view.main, 50, 200);
		expect(view.emitted('close')).toHaveLength(1);
	});

	test('does not treat a video background touch as the second half of a double tap', async () => {
		const view = setup({ type: 'video' });
		const video = view.main.querySelector('video')!;
		vi.spyOn(video, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 0, 200, 400));
		const now = vi.spyOn(Date.prototype, 'getTime');
		now.mockReturnValue(1000);
		await touchstart(view.main, 101, 200);
		now.mockReturnValue(1100);
		await touchstart(view.main, 99, 200);
		expect(view.transformer.style.transform).toContain('scale(1)');
		await tap(view.main, 99, 200);
		expect(view.emitted('close')).toHaveLength(1);
	});

	test('keeps native video controls inside the player and closes from the background', async () => {
		preferState.useNativeUiForVideoAudioPlayer = true;
		const view = setup({ type: 'video' });
		const video = view.main.querySelector('video')!;
		vi.spyOn(video, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 0, 200, 400));
		const play = vi.spyOn(video, 'play').mockResolvedValue();
		await tap(view.main, 200, 200);
		expect(play).not.toHaveBeenCalled();
		expect(view.emitted('close')).toBeUndefined();
		await pointer(view.main, 'pointerdown', 50, 200);
		await pointer(view.main, 'pointerup', 50, 200);
		await fireEvent.click(view.main, { clientX: 50, clientY: 200 });
		expect(view.emitted('close')).toHaveLength(1);
	});

});
