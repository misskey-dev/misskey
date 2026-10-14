/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { InjectionKey } from 'vue';

export type Awaitable<T> = T | Promise<T>;

export type ExtractInjectedType<T extends InjectionKey<any>> = T extends InjectionKey<infer U> ? U : never;
