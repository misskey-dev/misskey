/**
 * Misskey Text Analyzer
 */

import { TextElementBold } from './elements/bold';
import { TextElementBig } from './elements/big';
import { TextElementCode } from './elements/code';
import { TextElementEmoji } from './elements/emoji';
import { TextElementHashtag } from './elements/hashtag';
import { TextElementInlineCode } from './elements/inline-code';
import { TextElementLink } from './elements/link';
import { TextElementMention } from './elements/mention';
import { TextElementQuote } from './elements/quote';
import { TextElementSearch } from './elements/search';
import { TextElementTitle } from './elements/title';
import { TextElementUrl } from './elements/url';
import { TextElementMotion } from './elements/motion';
import { groupOn } from '../../prelude/array';
import * as A from '../../prelude/array';
import * as S from '../../prelude/string';

const elements = [
	require('./elements/big'),
	require('./elements/bold'),
	require('./elements/title'),
	require('./elements/url'),
	require('./elements/link'),
	require('./elements/mention'),
	require('./elements/hashtag'),
	require('./elements/code'),
	require('./elements/inline-code'),
	require('./elements/quote'),
	require('./elements/emoji'),
	require('./elements/search'),
	require('./elements/motion')
].map(element => element.default as TextElementProcessor);

export type TextElement = { type: 'text', content: string }
	| TextElementBold
	| TextElementBig
	| TextElementCode
	| TextElementEmoji
	| TextElementHashtag
	| TextElementInlineCode
	| TextElementLink
	| TextElementMention
	| TextElementQuote
	| TextElementSearch
	| TextElementTitle
	| TextElementUrl
	| TextElementMotion;
export type TextElementProcessor = (text: string, isBegin: boolean) => TextElement | TextElement[];

export default (source: string): TextElement[] => {
	if (source == null || source == '') {
		return null;
	}

	const tokens: TextElement[] = [];

	function push(token: TextElement) {
		if (token != null) {
			tokens.push(token);
			source = source.substr(token.content.length);
		}
	}

	let i = 0;

	// パース
	while (source != '') {
		const parsed = elements.some(el => {
			let _tokens = el(source, i == 0);
			if (_tokens) {
				if (!Array.isArray(_tokens)) {
					_tokens = [_tokens];
				}
				_tokens.forEach(push);
				return true;
			} else {
				return false;
			}
		});

		if (!parsed) {
			push({
				type: 'text',
				content: source[0]
			});
		}

		i++;
	}

	const combineText = (es: TextElement[]): TextElement =>
		({ type: 'text', content: S.concat(es.map(e => e.content)) });

	return A.concat(groupOn(x => x.type, tokens).map(es =>
		es[0].type === 'text' ? [combineText(es)] : es
	));
};
