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
const OUTPUT_PATH1 = resolve(_dirname, '../../../built/.config.json');
const OUTPUT_PATH2 = resolve(_dirname, '../../../src-js/.config.json');

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

	console.log(`${ymlPath} → ${OUTPUT_PATH1}`);
	console.log(`${ymlPath} → ${OUTPUT_PATH2}`);

	const yamlContent = fs.readFileSync(ymlPath, 'utf-8');
	const jsonContent = yaml.load(yamlContent);
	if (!fs.existsSync(dirname(OUTPUT_PATH1))) {
		fs.mkdirSync(dirname(OUTPUT_PATH1), { recursive: true });
	}
	if (!fs.existsSync(dirname(OUTPUT_PATH2))) {
		fs.mkdirSync(dirname(OUTPUT_PATH2), { recursive: true });
	}
	fs.writeFileSync(OUTPUT_PATH1, JSON.stringify({
		'_NOTE_': 'This file is auto-generated from YAML file. DO NOT EDIT.',
		...jsonContent,
	}), 'utf-8');
	fs.writeFileSync(OUTPUT_PATH2, JSON.stringify({
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
