/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'eventemitter3';

export class Joystick extends EventEmitter<{
	'start': (vec: { x: number; y: number }) => void;
	'end': () => void;
	'updateVector': (vec: { x: number; y: number }) => void; // -1.0 ~ 1.0
}> {
	private el: HTMLDivElement;
	private startPos: { x: number; y: number } | null = null;
	private radiusPx: number;

	constructor(el: HTMLDivElement, options: { radiusPx: number }) {
		super();
		this.el = el;
		this.radiusPx = options.radiusPx;
		this.el.addEventListener('pointerdown', this.onPointerDown);
		this.el.addEventListener('pointermove', this.onPointerMove);
		this.el.addEventListener('pointerup', this.onPointerUp);
		this.el.addEventListener('touchstart', ev => ev.preventDefault(), { passive: false });
		this.el.addEventListener('touchmove', ev => ev.preventDefault(), { passive: false });
	}

	private onPointerDown = (ev: PointerEvent) => {
		ev.preventDefault();
		this.el.setPointerCapture(ev.pointerId);
		this.startPos = { x: ev.offsetX, y: ev.offsetY };
		this.emit('start', this.startPos);
	};

	private onPointerMove = (ev: PointerEvent) => {
		ev.preventDefault();
		if (this.startPos == null) return;
		const vec = {
			x: ev.offsetX - this.startPos.x,
			y: ev.offsetY - this.startPos.y,
		};
		const len = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
		if (len > this.radiusPx) {
			vec.x = (vec.x / len) * this.radiusPx;
			vec.y = (vec.y / len) * this.radiusPx;
		}
		const normVec = {
			x: vec.x / this.radiusPx,
			y: vec.y / this.radiusPx,
		};
		this.emit('updateVector', normVec);
	};

	private onPointerUp = (ev: PointerEvent) => {
		ev.preventDefault();
		this.el.releasePointerCapture(ev.pointerId);
		this.startPos = null;
		this.emit('end');
		this.emit('updateVector', { x: 0, y: 0 });
	};
}
