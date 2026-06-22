/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function calcPopupPosition(el: HTMLElement, props: {
	anchorElement?: HTMLElement | null;
	innerMargin: number;
	direction: 'top' | 'bottom' | 'left' | 'right';
	align: 'top' | 'bottom' | 'left' | 'right' | 'center';
	alignOffset?: number;
	x?: number;
	y?: number;
}): { top: number; left: number; transformOrigin: string; } {
	const rootStyle = getComputedStyle(document.documentElement);
	const scaleValue = rootStyle.getPropertyValue('--MI-scale').trim();
	const scale = Number.parseFloat(scaleValue) || 1;
	const contentRect = el.getBoundingClientRect();
	const contentWidth = contentRect.width;
	const contentHeight = contentRect.height;

	let rect: DOMRect;

	if (props.anchorElement) {
		rect = props.anchorElement.getBoundingClientRect();
	}

	const calcPosWhenTop = () => {
		let left: number;
		let top: number;

		if (props.anchorElement) {
			left = rect.left + window.scrollX + (rect.width / 2);
			top = (rect.top + window.scrollY - contentHeight) - props.innerMargin;
		} else {
			left = props.x!;
			top = (props.y! - contentHeight) - props.innerMargin;
		}

		left -= (contentWidth / 2);

		if (left + contentWidth - window.scrollX > window.innerWidth) {
			left = window.innerWidth - contentWidth + window.scrollX - 1;
		}

		if (left < window.scrollX) {
			left = window.scrollX;
		}

		return [left, top];
	};

	const calcPosWhenBottom = () => {
		let left: number;
		let top: number;

		if (props.anchorElement) {
			left = rect.left + window.scrollX + (rect.width / 2);
			top = (rect.bottom + window.scrollY) + props.innerMargin;
		} else {
			left = props.x!;
			top = (props.y!) + props.innerMargin;
		}

		left -= (contentWidth / 2);

		if (left + contentWidth - window.scrollX > window.innerWidth) {
			left = window.innerWidth - contentWidth + window.scrollX - 1;
		}

		if (left < window.scrollX) {
			left = window.scrollX;
		}

		return [left, top];
	};

	const calcPosWhenLeft = () => {
		let left: number;
		let top: number;

		if (props.anchorElement) {
			left = (rect.left + window.scrollX - contentWidth) - props.innerMargin;
			top = rect.top + window.scrollY + (rect.height / 2);
		} else {
			left = (props.x! - contentWidth) - props.innerMargin;
			top = props.y!;
		}

		top -= (contentHeight / 2);

		if (top + contentHeight - window.scrollY > window.innerHeight) {
			top = window.innerHeight - contentHeight + window.scrollY - 1;
		}

		if (left < window.scrollX) {
			left = window.scrollX;
		}

		return [left, top];
	};

	const calcPosWhenRight = () => {
		let left = 0; // TSを黙らすためとりあえず初期値を0に
		let top = 0; // TSを黙らすためとりあえず初期値を0に

		if (props.anchorElement) {
			left = (rect.right + window.scrollX) + props.innerMargin;

			if (props.align === 'top') {
				top = rect.top + window.scrollY;
				if (props.alignOffset != null) top += props.alignOffset;
			} else if (props.align === 'bottom') {
				// TODO
			} else { // center
				top = rect.top + window.scrollY + (rect.height / 2);
				top -= (contentHeight / 2);
			}
		} else {
			left = props.x! + props.innerMargin;
			top = props.y!;
			top -= (contentHeight / 2);
		}

		if (top + contentHeight - window.scrollY > window.innerHeight) {
			top = window.innerHeight - contentHeight + window.scrollY - 1;
		}

		if (left < window.scrollX) {
			left = window.scrollX;
		}

		return [left, top];
	};

	const calc = (): {
		left: number;
		top: number;
		transformOrigin: string;
	} => {
		switch (props.direction) {
			case 'top': {
				const [left, top] = calcPosWhenTop();

				// ツールチップを上に向かって表示するスペースがなければ下に向かって出す
				if (top - window.scrollY < 0) {
					const [left, top] = calcPosWhenBottom();
					return { left: left / scale, top: top / scale, transformOrigin: 'center top' };
				}

				return { left: left / scale, top: top / scale, transformOrigin: 'center bottom' };
			}

			case 'bottom': {
				const [left, top] = calcPosWhenBottom();
				// TODO: ツールチップを下に向かって表示するスペースがなければ上に向かって出す
				return { left: left / scale, top: top / scale, transformOrigin: 'center top' };
			}

			case 'left': {
				const [left, top] = calcPosWhenLeft();

				// ツールチップを左に向かって表示するスペースがなければ右に向かって出す
				if (left - window.scrollX < 0) {
					const [left, top] = calcPosWhenRight();
					return { left: left / scale, top: top / scale, transformOrigin: 'left center' };
				}

				return { left: left / scale, top: top / scale, transformOrigin: 'right center' };
			}

			case 'right': {
				const [left, top] = calcPosWhenRight();
				// TODO: ツールチップを右に向かって表示するスペースがなければ左に向かって出す
				return { left: left / scale, top: top / scale, transformOrigin: 'left center' };
			}
		}
	};

	return calc();
}
