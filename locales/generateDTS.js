import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import * as yaml from 'js-yaml';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const parameterRegExp = /\{(\w+)\}/g;

function createMemberType(item) {
	if (typeof item !== 'string') {
		return ts.factory.createTypeLiteralNode(createMembers(item));
	}
	const parameters = Array.from(
		item.matchAll(parameterRegExp),
		([, parameter]) => parameter,
	);
	return parameters.length
		? ts.factory.createTypeReferenceNode(
				ts.factory.createIdentifier('ParameterizedString'),
				[
					ts.factory.createUnionTypeNode(
						parameters.map((parameter) =>
							ts.factory.createStringLiteral(parameter),
						),
					),
				],
			)
		: ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
}

function createMembers(record) {
	return Object.entries(record).map(([k, v]) => {
		const node = ts.factory.createPropertySignature(
			undefined,
			ts.factory.createStringLiteral(k),
			undefined,
			createMemberType(v),
		);
		if (typeof v === 'string') {
			ts.addSyntheticLeadingComment(
				node,
				ts.SyntaxKind.MultiLineCommentTrivia,
				`*
 * ${v.replace(/\n/g, '\n * ')}
 `,
				true,
			);
		}
		return node;
	});
}

export default function generateDTS() {
	const locale = yaml.load(fs.readFileSync(`${__dirname}/ja-JP.yml`, 'utf-8'));
	const members = createMembers(locale);
	const elements = [
		ts.factory.createVariableStatement(
			[ts.factory.createToken(ts.SyntaxKind.DeclareKeyword)],
			ts.factory.createVariableDeclarationList(
				[
					ts.factory.createVariableDeclaration(
						ts.factory.createIdentifier('kParameters'),
						undefined,
						ts.factory.createTypeOperatorNode(
							ts.SyntaxKind.UniqueKeyword,
							ts.factory.createKeywordTypeNode(ts.SyntaxKind.SymbolKeyword),
						),
						undefined,
					),
				],
				ts.NodeFlags.Const,
			),
		),
		ts.factory.createInterfaceDeclaration(
			[ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
			ts.factory.createIdentifier('ParameterizedString'),
			[
				ts.factory.createTypeParameterDeclaration(
					undefined,
					ts.factory.createIdentifier('T'),
					ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
					ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
				),
			],
			undefined,
			[
				ts.factory.createPropertySignature(
					undefined,
					ts.factory.createComputedPropertyName(
						ts.factory.createIdentifier('kParameters'),
					),
					undefined,
					ts.factory.createTypeReferenceNode(
						ts.factory.createIdentifier('T'),
						undefined,
					),
				),
			],
		),
		ts.factory.createInterfaceDeclaration(
			[ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
			ts.factory.createIdentifier('ILocale'),
			undefined,
			undefined,
			[
				ts.factory.createIndexSignature(
					undefined,
					[
						ts.factory.createParameterDeclaration(
							undefined,
							undefined,
							ts.factory.createIdentifier('_'),
							undefined,
							ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
							undefined,
						),
					],
					ts.factory.createUnionTypeNode([
						ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
						ts.factory.createTypeReferenceNode(
							ts.factory.createIdentifier('ParameterizedString'),
						),
						ts.factory.createTypeReferenceNode(
							ts.factory.createIdentifier('ILocale'),
							undefined,
						),
					]),
				),
			],
		),
		ts.factory.createInterfaceDeclaration(
			[ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
			ts.factory.createIdentifier('Locale'),
			undefined,
			[
				ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
					ts.factory.createExpressionWithTypeArguments(
						ts.factory.createIdentifier('ILocale'),
						undefined,
					),
				]),
			],
			members,
		),
		ts.factory.createVariableStatement(
			[ts.factory.createToken(ts.SyntaxKind.DeclareKeyword)],
			ts.factory.createVariableDeclarationList(
				[
					ts.factory.createVariableDeclaration(
						ts.factory.createIdentifier('locales'),
						undefined,
						ts.factory.createTypeLiteralNode([
							ts.factory.createIndexSignature(
								undefined,
								[
									ts.factory.createParameterDeclaration(
										undefined,
										undefined,
										ts.factory.createIdentifier('lang'),
										undefined,
										ts.factory.createKeywordTypeNode(
											ts.SyntaxKind.StringKeyword,
										),
										undefined,
									),
								],
								ts.factory.createTypeReferenceNode(
									ts.factory.createIdentifier('Locale'),
									undefined,
								),
							),
						]),
						undefined,
					),
				],
				ts.NodeFlags.Const,
			),
		),
		ts.factory.createFunctionDeclaration(
			[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
			undefined,
			ts.factory.createIdentifier('build'),
			undefined,
			[],
			ts.factory.createTypeReferenceNode(
				ts.factory.createIdentifier('Locale'),
				undefined,
			),
			undefined,
		),
		ts.factory.createExportDefault(ts.factory.createIdentifier('locales')),
	];
	ts.addSyntheticLeadingComment(
		elements[0],
		ts.SyntaxKind.MultiLineCommentTrivia,
		' eslint-disable ',
		true,
	);
	ts.addSyntheticLeadingComment(
		elements[0],
		ts.SyntaxKind.SingleLineCommentTrivia,
		' This file is generated by locales/generateDTS.js',
		true,
	);
	ts.addSyntheticLeadingComment(
		elements[0],
		ts.SyntaxKind.SingleLineCommentTrivia,
		' Do not edit this file directly.',
		true,
	);
	const printed = ts
		.createPrinter({
			newLine: ts.NewLineKind.LineFeed,
		})
		.printList(
			ts.ListFormat.MultiLine,
			ts.factory.createNodeArray(elements),
			ts.createSourceFile(
				'index.d.ts',
				'',
				ts.ScriptTarget.ESNext,
				true,
				ts.ScriptKind.TS,
			),
		);

	fs.writeFileSync(`${__dirname}/index.d.ts`, printed, 'utf-8');
}
