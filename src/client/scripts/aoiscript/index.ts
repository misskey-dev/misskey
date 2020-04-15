/**
 * AoiScript
 */

import {
	faMagic,
	faSquareRootAlt,
	faAlignLeft,
	faShareAlt,
	faPlus,
	faMinus,
	faTimes,
	faDivide,
	faList,
	faQuoteRight,
	faEquals,
	faGreaterThan,
	faLessThan,
	faGreaterThanEqual,
	faLessThanEqual,
	faNotEqual,
	faDice,
	faSortNumericUp,
	faExchangeAlt,
	faRecycle,
	faIndent,
	faCalculator,
} from '@fortawesome/free-solid-svg-icons';
import { faFlag } from '@fortawesome/free-regular-svg-icons';

export type Block<V = any> = {
	id: string;
	type: string;
	args: Block[];
	value: V;
};

export type FnBlock = Block<{
	slots: {
		name: string;
		type: Type;
	}[];
	expression: Block;
}>;

export type Variable = Block & {
	name: string;
};

export type Type = 'string' | 'number' | 'boolean' | 'stringArray' | null;

export const funcDefs: Record<string, { in: any[]; out: any; category: string; icon: any; }> = {
	if:              { in: ['boolean', 0, 0],              out: 0,             category: 'flow',       icon: faShareAlt, },
	for:             { in: ['number', 'function'],         out: null,          category: 'flow',       icon: faRecycle, },
	not:             { in: ['boolean'],                    out: 'boolean',     category: 'logical',    icon: faFlag, },
	or:              { in: ['boolean', 'boolean'],         out: 'boolean',     category: 'logical',    icon: faFlag, },
	and:             { in: ['boolean', 'boolean'],         out: 'boolean',     category: 'logical',    icon: faFlag, },
	add:             { in: ['number', 'number'],           out: 'number',      category: 'operation',  icon: faPlus, },
	subtract:        { in: ['number', 'number'],           out: 'number',      category: 'operation',  icon: faMinus, },
	multiply:        { in: ['number', 'number'],           out: 'number',      category: 'operation',  icon: faTimes, },
	divide:          { in: ['number', 'number'],           out: 'number',      category: 'operation',  icon: faDivide, },
	mod:             { in: ['number', 'number'],           out: 'number',      category: 'operation',  icon: faDivide, },
	round:           { in: ['number'],                     out: 'number',      category: 'operation',  icon: faCalculator, },
	eq:              { in: [0, 0],                         out: 'boolean',     category: 'comparison', icon: faEquals, },
	notEq:           { in: [0, 0],                         out: 'boolean',     category: 'comparison', icon: faNotEqual, },
	gt:              { in: ['number', 'number'],           out: 'boolean',     category: 'comparison', icon: faGreaterThan, },
	lt:              { in: ['number', 'number'],           out: 'boolean',     category: 'comparison', icon: faLessThan, },
	gtEq:            { in: ['number', 'number'],           out: 'boolean',     category: 'comparison', icon: faGreaterThanEqual, },
	ltEq:            { in: ['number', 'number'],           out: 'boolean',     category: 'comparison', icon: faLessThanEqual, },
	strLen:          { in: ['string'],                     out: 'number',      category: 'text',       icon: faQuoteRight, },
	strPick:         { in: ['string', 'number'],           out: 'string',      category: 'text',       icon: faQuoteRight, },
	strReplace:      { in: ['string', 'string', 'string'], out: 'string',      category: 'text',       icon: faQuoteRight, },
	strReverse:      { in: ['string'],                     out: 'string',      category: 'text',       icon: faQuoteRight, },
	join:            { in: ['stringArray', 'string'],      out: 'string',      category: 'text',       icon: faQuoteRight, },
	stringToNumber:  { in: ['string'],                     out: 'number',      category: 'convert',    icon: faExchangeAlt, },
	numberToString:  { in: ['number'],                     out: 'string',      category: 'convert',    icon: faExchangeAlt, },
	splitStrByLine:  { in: ['string'],                     out: 'stringArray', category: 'convert',    icon: faExchangeAlt, },
	pick:            { in: [null, 'number'],               out: null,          category: 'list',       icon: faIndent, },
	listLen:         { in: [null],                         out: 'number',      category: 'list',       icon: faIndent, },
	rannum:          { in: ['number', 'number'],           out: 'number',      category: 'random',     icon: faDice, },
	dailyRannum:     { in: ['number', 'number'],           out: 'number',      category: 'random',     icon: faDice, },
	seedRannum:      { in: [null, 'number', 'number'],     out: 'number',      category: 'random',     icon: faDice, },
	random:          { in: ['number'],                     out: 'boolean',     category: 'random',     icon: faDice, },
	dailyRandom:     { in: ['number'],                     out: 'boolean',     category: 'random',     icon: faDice, },
	seedRandom:      { in: [null, 'number'],               out: 'boolean',     category: 'random',     icon: faDice, },
	randomPick:      { in: [0],                            out: 0,             category: 'random',     icon: faDice, },
	dailyRandomPick: { in: [0],                            out: 0,             category: 'random',     icon: faDice, },
	seedRandomPick:  { in: [null, 0],                      out: 0,             category: 'random',     icon: faDice, },
	DRPWPM:      { in: ['stringArray'],                out: 'string',      category: 'random',     icon: faDice, }, // dailyRandomPickWithProbabilityMapping
};

export const literalDefs: Record<string, { out: any; category: string; icon: any; }> = {
	text:          { out: 'string',      category: 'value', icon: faQuoteRight, },
	multiLineText: { out: 'string',      category: 'value', icon: faAlignLeft, },
	textList:      { out: 'stringArray', category: 'value', icon: faList, },
	number:        { out: 'number',      category: 'value', icon: faSortNumericUp, },
	ref:           { out: null,          category: 'value', icon: faMagic, },
	aiScriptVar:   { out: null,          category: 'value', icon: faMagic, },
	fn:            { out: 'function',    category: 'value', icon: faSquareRootAlt, },
};

export const blockDefs = [
	...Object.entries(literalDefs).map(([k, v]) => ({
		type: k, out: v.out, category: v.category, icon: v.icon
	})),
	...Object.entries(funcDefs).map(([k, v]) => ({
		type: k, out: v.out, category: v.category, icon: v.icon
	}))
];

export function isFnBlock(block: Block): block is FnBlock {
	return block.type === 'fn';
}

export type PageVar = { name: string; value: any; type: Type; };

export const envVarsDef: Record<string, Type> = {
	AI: 'string',
	URL: 'string',
	VERSION: 'string',
	LOGIN: 'boolean',
	NAME: 'string',
	USERNAME: 'string',
	USERID: 'string',
	NOTES_COUNT: 'number',
	FOLLOWERS_COUNT: 'number',
	FOLLOWING_COUNT: 'number',
	IS_CAT: 'boolean',
	SEED: null,
	YMD: 'string',
	AISCRIPT_DISABLED: 'boolean',
	NULL: null,
};

export function isLiteralBlock(v: Block) {
	if (v.type === null) return true;
	if (literalDefs[v.type]) return true;
	return false;
}
