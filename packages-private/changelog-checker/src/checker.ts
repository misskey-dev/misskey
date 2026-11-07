/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Release } from './parser.js';

export class Result {
	public readonly success: boolean;
	public readonly message?: string;

	private constructor(success: boolean, message?: string) {
		this.success = success;
		this.message = message;
	}

	static ofSuccess(): Result {
		return new Result(true);
	}

	static ofFailed(message?: string): Result {
		return new Result(false, message);
	}
}

/**
 * develop -> masterまたはrelease -> masterを想定したパターン。
 * base側の先頭とhead側で追加された分のリリースより1つ前のバージョンが等価であるかチェックする。
 */
export function checkNewRelease(base: Release[], head: Release[]): Result {
	const releaseCountDiff = head.length - base.length;
	if (releaseCountDiff <= 0) {
		return Result.ofFailed('Invalid release count.');
	}

	// 追加分を除いた残り (= base に既にあったリリース) が順序ごと一致することを確認する。
	// 先頭だけ比較していると、より古いリリースが書き換えられていても素通りしてしまう
	const existingReleases = head.slice(releaseCountDiff);
	for (let relIdx = 0; relIdx < base.length; relIdx++) {
		if (base[relIdx].releaseName !== existingReleases[relIdx].releaseName) {
			return Result.ofFailed(`Contains unexpected releases. base:${base[relIdx].releaseName}, head:${existingReleases[relIdx].releaseName}`);
		}
	}

	return Result.ofSuccess();
}

function isSameItems(base: string[], head: string[]) {
	return base.length === head.length && base.every((item, idx) => item === head[idx]);
}

/**
 * topic -> developまたはtopic -> masterを想定したパターン。
 * head側の最新リリース配下に書き加えられているかをチェックする。
 */
export function checkNewTopic(base: Release[], head: Release[]): Result {
	if (head.length !== base.length) {
		return Result.ofFailed('Invalid release count.');
	}

	const headLatest = head[0];
	for (let relIdx = 0; relIdx < base.length; relIdx++) {
		const baseItem = base[relIdx];
		const headItem = head[relIdx];
		if (baseItem.releaseName !== headItem.releaseName) {
			// リリースの順番が変わってると成立しないのでエラーにする
			return Result.ofFailed(`Release is different. base:${baseItem.releaseName}, head:${headItem.releaseName}`);
		}

		if (baseItem.categories.length !== headItem.categories.length) {
			// カテゴリごと書き加えられたパターン
			if (headLatest.releaseName !== headItem.releaseName) {
				// 最新リリース以外に追記されていた場合
				return Result.ofFailed(`There is an error in the update history. expected additions:${headLatest.releaseName}, actual additions:${headItem.releaseName}`);
			}
		} else {
			// カテゴリ数の変動はないのでリスト項目の数をチェック
			for (let catIdx = 0; catIdx < baseItem.categories.length; catIdx++) {
				const baseCategory = baseItem.categories[catIdx];
				const headCategory = headItem.categories[catIdx];

				if (baseCategory.categoryName !== headCategory.categoryName) {
					// カテゴリの順番が変わっていると成立しないのでエラーにする
					return Result.ofFailed(`Category is different. base:${baseCategory.categoryName}, head:${headCategory.categoryName}`);
				}

				if (!isSameItems(baseCategory.items, headCategory.items)) {
					if (headLatest.releaseName !== headItem.releaseName) {
						// 最新リリース以外が変更されていた場合
						return Result.ofFailed(`There is an error in the update history. expected additions:${headLatest.releaseName}, actual additions:${headItem.releaseName}`);
					}
				}
			}
		}
	}

	return Result.ofSuccess();
}
