/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Wasd {
	private isWPressing = false;
	private isSPressing = false;
	private isAPressing = false;
	private isDPressing = false;
	private isDashing = false;
	private setCameraMoveVector: (vec: { x: number; y: number }, dash: boolean) => void;

	constructor(options: {
		setCameraMoveVector: Wasd['setCameraMoveVector'];
	}) {
		this.setCameraMoveVector = options.setCameraMoveVector;
	}

	private calcWasdVec() {
		const vec = { x: 0, y: 0 };
		if (this.isWPressing) vec.y -= 1;
		if (this.isSPressing) vec.y += 1;
		if (this.isAPressing) vec.x -= 1;
		if (this.isDPressing) vec.x += 1;
		return vec;
	}

	public keydown(ev: KeyboardEvent) {
		if (ev.repeat) return;

		switch (ev.code) {
			case 'KeyW':
				this.isWPressing = true;
				this.setCameraMoveVector(this.calcWasdVec(), this.isDashing);
				break;
			case 'KeyS':
				this.isSPressing = true;
				this.setCameraMoveVector(this.calcWasdVec(), this.isDashing);
				break;
			case 'KeyA':
				this.isAPressing = true;
				this.setCameraMoveVector(this.calcWasdVec(), this.isDashing);
				break;
			case 'KeyD':
				this.isDPressing = true;
				this.setCameraMoveVector(this.calcWasdVec(), this.isDashing);
				break;
			case 'ShiftLeft':
			case 'ShiftRight':
				this.isDashing = true;
				this.setCameraMoveVector(this.calcWasdVec(), this.isDashing);
				break;
		}
	}

	public keyup(ev: KeyboardEvent) {
		switch (ev.code) {
			case 'KeyW':
				this.isWPressing = false;
				this.setCameraMoveVector(this.calcWasdVec(), this.isDashing);
				break;
			case 'KeyS':
				this.isSPressing = false;
				this.setCameraMoveVector(this.calcWasdVec(), this.isDashing);
				break;
			case 'KeyA':
				this.isAPressing = false;
				this.setCameraMoveVector(this.calcWasdVec(), this.isDashing);
				break;
			case 'KeyD':
				this.isDPressing = false;
				this.setCameraMoveVector(this.calcWasdVec(), this.isDashing);
				break;
			case 'ShiftLeft':
			case 'ShiftRight':
				this.isDashing = false;
				this.setCameraMoveVector(this.calcWasdVec(), this.isDashing);
				break;
		}
	}
}
