/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const { TestEnvironment } = require('jest-environment-node');
const { init } = require('slacc');

init(1);

module.exports = class UnitTestEnvironment extends TestEnvironment {};
