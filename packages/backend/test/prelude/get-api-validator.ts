/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Ajv from 'ajv';
import { Schema } from '@/misc/schema';

export const getValidator = (paramDef: Schema) => {
	const ajv = new Ajv({
		useDefaults: true,
	});
	ajv.addFormat('misskey:id', /^[a-zA-Z0-9]+$/);

	return ajv.compile(paramDef);
};
