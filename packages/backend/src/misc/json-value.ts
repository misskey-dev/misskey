/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type JsonValue = JsonArray | JsonObject | string | number | boolean | null;
export type JsonObject = {[K in string]?: JsonValue};
export type JsonArray = JsonValue[];
