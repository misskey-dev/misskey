/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * YAMLファイルをJSONファイルに変換するスクリプト
 * ビルド前に実行し、ランタイムにjs-yamlを含まないようにする
 */

import fs from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const configDir = resolve(_dirname, '../../../.config');
const OUTPUT_PATH = resolve(_dirname, '../../../built/.config.json');

// TODO: yamlのパースに失敗したときのエラーハンドリング

/**
 * YAMLファイルをJSONファイルに変換
 * @param {string} ymlPath - YAMLファイルのパス
 */
function yamlToJson(ymlPath) {
	if (!fs.existsSync(ymlPath)) {
		console.warn(`YAML file not found: ${ymlPath}`);
		return;
	}

	console.log(`${ymlPath} → ${OUTPUT_PATH}`);

	const yamlContent = fs.readFileSync(ymlPath, 'utf-8');
	const jsonContent = yaml.load(yamlContent);
	if (!fs.existsSync(dirname(OUTPUT_PATH))) {
		fs.mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
	}
	fs.writeFileSync(OUTPUT_PATH, JSON.stringify({
		'_NOTE_': 'This file is auto-generated from YAML file. DO NOT EDIT.',
		...jsonContent,
	}), 'utf-8');
}

if (process.env.MISSKEY_CONFIG_YML) {
	const customYmlPath = resolve(configDir, process.env.MISSKEY_CONFIG_YML);
	yamlToJson(customYmlPath);
} else {
	yamlToJson(resolve(configDir, process.env.NODE_ENV === 'test' ? 'test.yml' : 'default.yml'));
}

console.log('Configuration compiled ✓');
