/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// devモードで起動される際（index.htmlを使うとき）はrouterが暴発してしまってうまく読み込めない。
// よって、devモードとして起動されるときはビルド時に組み込む形としておく。
// (pnpm start時はpugファイルの中で静的リソースとして読み込むようになっており、この問題は起こっていない)
import '@tabler/icons-webfont/tabler-icons.scss';

import('@/_boot_.js');
