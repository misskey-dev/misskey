import { literalDefs, Type } from '.';

// value

export type EmptyValue = {
	type: null;
	id: string;
	value: null;
};

export type TextValue = {
	type: 'text';
	id: string;
	value: string;
};

export type MultiLineTextValue = {
	type: 'multiLineText';
	id: string;
	value: string;
};

export type TextListValue = {
	type: 'textList';
	id: string;
	value: string;
};

export type NumberValue = {
	type: 'number';
	id: string;
	value: number;
};

export type RefValue = {
	type: 'ref';
	id: string;
	value: string; // value is variable name
};

export type AiScriptRefValue = {
	type: 'aiScriptVar';
	id: string;
	value: string; // value is variable name
};

export type UserFnValue = {
	type: 'fn';
	id: string;
	value: {
		slots: {
			name: string;
			type: Type;
		}[];
		expression: Expr;
	};
};

export type Value =
	EmptyValue | TextValue | MultiLineTextValue | TextListValue | NumberValue | RefValue | AiScriptRefValue | UserFnValue;

export function isLiteralValue(expr: Expr): expr is Value {
	return (expr.type == null || literalDefs[expr.type] != null);
}

// call function

export type CallFn = { // "fn:hoge" or string
	type: string;
	id: string;
	args: Expr[];
	value: null;
};

// variable
export type Variable = (Value | CallFn) & {
	name: string;
};

// expression
export type Expr = Variable | Value | CallFn;
