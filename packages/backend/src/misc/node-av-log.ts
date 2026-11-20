/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Log } from 'node-av/lib';
import { AV_LOG_ERROR } from 'node-av/constants';

// libav 自体のログ出力を抑制する
// node-av を使うモジュールから副作用 import する必要がある
Log.setLevel(AV_LOG_ERROR);
