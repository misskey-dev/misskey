/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

declare const kParameters: unique symbol;

export type ParameterizedString<T extends string = string> = string & {
	[kParameters]: T;
};

export interface ILocale {
	[_: string]: string | ParameterizedString | ILocale;
}
