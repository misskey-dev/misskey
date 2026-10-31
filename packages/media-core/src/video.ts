/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 動画の処理 (fluent-ffmpeg と ffmpeg / ffprobe が必要)
// fluent-ffmpeg を必要とする利用側でのみ読み込まれるようにサブパスに分ける

export { generateVideoThumbnail } from './video/thumbnail.js';
export { hasVideoTrack } from './video/video-track.js';
export type { VideoTrackLogger } from './video/video-track.js';
