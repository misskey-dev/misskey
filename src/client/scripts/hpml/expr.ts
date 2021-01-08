import { literalDefs, Type } from ".";

export type ExprBase = {
	id: string;
};

// value

export type EmptyValue = ExprBase & {
	type: null;
	value: null;
};

export type TextValue = ExprBase & {
	type: 'text';
	value: string;
};

export type MultiLineTextValue = ExprBase  & {
	type: 'multiLineText';
	value: string;
};

export type TextListValue = ExprBase & {
	type: 'textList';
	value: string;
};

export type NumberValue = ExprBase & {
	type: 'number';
	value: number;
};

export type RefValue = ExprBase & {
	type: 'ref';
	value: string; // value is variable name
};

export type AiScriptRefValue = ExprBase & {
	type: 'aiScriptVar';
	value: string; // value is variable name
};

export type UserFnValue = ExprBase & {
	type: 'fn';
	value: UserFnInnerValue;
};
type UserFnInnerValue = {
	slots: {
		name: string;
		type: Type;
	}[];
	expression: Expr;
};

export type Value =
	EmptyValue | TextValue | MultiLineTextValue | TextListValue | NumberValue | RefValue | AiScriptRefValue | UserFnValue;

export function isLiteralValue(expr: Expr): expr is Value {
	if (expr.type == null) return true;
	if (literalDefs[expr.type]) return true;
	return false;
}

// call function

export type CallFn = ExprBase & { // "fn:hoge" or string
	type: string;
	args: Expr[];
	value: null;
};

// variable
export type Variable = (Value | CallFn) & {
	name: string;
};

// expression
export type Expr = Variable | Value | CallFn;
