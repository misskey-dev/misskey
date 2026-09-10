/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import type { AnyValibotSchema } from '@/misc/schema/introspect.js';

/**
 * paramDef を「入力が妥当か」を boolean で返す関数に変換する。
 */
export const getValidator = (paramDef: AnyValibotSchema): ((params: unknown) => boolean) =>
	(params: unknown) => v.safeParse(paramDef, params).success;
