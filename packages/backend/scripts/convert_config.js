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

/**
 * YAMLファイルをJSONファイルに変換
 * @param {string} ymlPath - YAMLファイルのパス
 * @param {string} jsonPath - JSONファイルの出力パス
 */
function convertYamlToJson(ymlPath, jsonPath) {
	if (!fs.existsSync(ymlPath)) {
		console.log(`skipped: ${ymlPath} is not found`);
		return;
	}

	const yamlContent = fs.readFileSync(ymlPath, 'utf-8');
	const jsonContent = yaml.load(yamlContent);
	fs.writeFileSync(jsonPath, JSON.stringify({
		'_NOTE_': 'This file is auto-generated from YAML file. DO NOT EDIT.',
		...jsonContent,
	}), 'utf-8');
	console.log(`✓ ${ymlPath} → ${jsonPath}`);
}

// default.yml と test.yml を変換
convertYamlToJson(
	resolve(configDir, 'default.yml'),
	resolve(configDir, 'default.json'),
);

convertYamlToJson(
	resolve(configDir, 'test.yml'),
	resolve(configDir, 'test.json'),
);

// MISSKEY_CONFIG_YML 環境変数が指定されている場合も変換
if (process.env.MISSKEY_CONFIG_YML) {
	const customYmlPath = resolve(configDir, process.env.MISSKEY_CONFIG_YML);
	const customJsonPath = customYmlPath.replace(/\.ya?ml$/i, '.json');
	convertYamlToJson(customYmlPath, customJsonPath);
}

console.log('Configuration compiled');
