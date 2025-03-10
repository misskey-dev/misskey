/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type PartiallyPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type VideoEl = PartiallyPartial<HTMLVideoElement, 'requestFullscreen'> & {
	webkitEnterFullscreen?(): void;
	webkitExitFullscreen?(): void;
};

type PlayerEl = PartiallyPartial<HTMLElement, 'requestFullscreen'>;

type RequestFullscreenProps = {
	readonly videoEl: VideoEl;
	readonly playerEl: PlayerEl;
	readonly options?: FullscreenOptions | null;
};

type ExitFullscreenProps = {
	readonly videoEl: VideoEl;
};

export const requestFullscreen = ({ videoEl, playerEl, options }: RequestFullscreenProps) => {
	if (playerEl.requestFullscreen != null) {
		playerEl.requestFullscreen(options ?? undefined);
		return;
	}
	if (videoEl.webkitEnterFullscreen != null) {
		videoEl.webkitEnterFullscreen();
		return;
	}
};

export const exitFullscreen = ({ videoEl }: ExitFullscreenProps) => {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (document.exitFullscreen != null) {
		document.exitFullscreen();
		return;
	}
	if (videoEl.webkitExitFullscreen != null) {
		videoEl.webkitExitFullscreen();
		return;
	}
};
