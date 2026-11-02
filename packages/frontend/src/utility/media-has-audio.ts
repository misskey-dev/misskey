/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export default async function hasAudio(media: HTMLMediaElement) {
	const cloned = media.cloneNode() as HTMLMediaElement;
	cloned.muted = (cloned as typeof cloned & Partial<HTMLVideoElement>).playsInline = true;
	cloned.play();
	await new Promise((resolve) => cloned.addEventListener('playing', resolve));
	const result = !!(cloned as any).audioTracks?.length || (cloned as any).mozHasAudio || !!(cloned as any).webkitAudioDecodedByteCount;
	cloned.remove();
	return result;
}
