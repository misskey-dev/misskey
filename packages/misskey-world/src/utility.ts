/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// ベクトルが小さいと動きが不自然になったりするので大きくする
// https://forum.babylonjs.com/t/the-camera-isnt-moving-correctly-in-my-custom-input/63286/2
export const WORLD_SCALE = 100;

//// cm to meter. 二重に適用しないように注意すること。
//export const cm = (value: number) => value / 100;
export const cm = (value: number) => value;
