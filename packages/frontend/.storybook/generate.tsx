/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { existsSync, readFileSync, globSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { basename, dirname } from 'node:path/posix';
import { GENERATOR, type State, generate } from 'astring';
import type * as estree from 'estree';
import { format } from 'prettier';

interface SatisfiesExpression extends estree.BaseExpression {
	type: 'SatisfiesExpression';
	expression: estree.Expression;
	reference: estree.Identifier;
}

interface ImportDeclaration extends estree.ImportDeclaration {
	kind?: 'type';
}

const generator = {
	...GENERATOR,
	ImportDeclaration(node: ImportDeclaration, state: State) {
		state.write('import ');
		if (node.kind === 'type') state.write('type ');
		const { specifiers } = node;
		if (specifiers.length > 0) {
			let i = 0;
			for (; i < specifiers.length; i++) {
				if (i > 0) {
					state.write(', ');
				}
				const specifier = specifiers[i]!;
				if (specifier.type === 'ImportDefaultSpecifier') {
					state.write(specifier.local.name, specifier);
				} else if (specifier.type === 'ImportNamespaceSpecifier') {
					state.write(`* as ${specifier.local.name}`, specifier);
				} else {
					break;
				}
			}
			if (i < specifiers.length) {
				state.write('{');
				for (; i < specifiers.length; i++) {
					const specifier = specifiers[i]! as estree.ImportSpecifier;
					const { name } = specifier.imported as estree.Identifier;
					state.write(name, specifier);
					if (name !== specifier.local.name) {
						state.write(` as ${specifier.local.name}`);
					}
					if (i < specifiers.length - 1) {
						state.write(', ');
					}
				}
				state.write('}');
			}
			state.write(' from ');
		}
		this.Literal(node.source, state);

		state.write(';');
	},
	SatisfiesExpression(node: SatisfiesExpression, state: State) {
		switch (node.expression.type) {
			case 'ArrowFunctionExpression': {
				state.write('(');
				this[node.expression.type](node.expression, state);
				state.write(')');
				break;
			}
			default: {
				// @ts-ignore
				this[node.expression.type](node.expression, state);
				break;
			}
		}
		state.write(' satisfies ', node as unknown as estree.Expression);
		this[node.reference.type](node.reference, state);
	},
};

type SplitCamel<
	T extends string,
	YC extends string = '',
	YN extends readonly string[] = []
> = T extends `${infer XH}${infer XR}`
	? XR extends ''
		? [...YN, Uncapitalize<`${YC}${XH}`>]
		: XH extends Uppercase<XH>
		? SplitCamel<XR, Lowercase<XH>, [...YN, YC]>
		: SplitCamel<XR, `${YC}${XH}`, YN>
	: YN;

// @ts-ignore
type SplitKebab<T extends string> = T extends `${infer XH}-${infer XR}`
	? [XH, ...SplitKebab<XR>]
	: [T];

type ToKebab<T extends readonly string[]> = T extends readonly [
	infer XO extends string
]
	? XO
	: T extends readonly [
			infer XH extends string,
			...infer XR extends readonly string[]
		]
	? `${XH}${XR extends readonly string[] ? `-${ToKebab<XR>}` : ''}`
	: '';

// @ts-ignore
type ToPascal<T extends readonly string[]> = T extends readonly [
	infer XH extends string,
	...infer XR extends readonly string[]
]
	? `${Capitalize<XH>}${ToPascal<XR>}`
	: '';

function h<T extends estree.Node>(
	component: T['type'],
	props: Omit<T, 'type'>
): T {
	const type = component.replace(/(?:^|-)([a-z])/g, (_, c) => c.toUpperCase());
	return Object.assign(props || {}, { type }) as T;
}

declare namespace h.JSX {
	type Element = estree.Node;
	type IntrinsicElements = {
		[T in keyof typeof generator as ToKebab<SplitCamel<Uncapitalize<T>>>]: {
			[K in keyof Omit<
				Parameters<(typeof generator)[T]>[0],
				'type'
			>]?: Parameters<(typeof generator)[T]>[0][K];
		};
	};
}

function toStories(component: string): Promise<string> {
	const msw = `${component.slice(0, -'.vue'.length)}.msw`;
	const implStories = `${component.slice(0, -'.vue'.length)}.stories.impl`;
	const metaStories = `${component.slice(0, -'.vue'.length)}.stories.meta`;
	const hasMsw = existsSync(`${msw}.ts`);
	const hasImplStories = existsSync(`${implStories}.ts`);
	const hasMetaStories = existsSync(`${metaStories}.ts`);
	const base = basename(component);
	const dir = dirname(component);
	const literal =
		<literal
			value={component
				.slice('src/'.length, -'.vue'.length)
				.replace(/\./g, '/')}
		/> as estree.Literal;
	const identifier =
		<identifier
			name={base
				.slice(0, -'.vue'.length)
				.replace(/[-.]|^(?=\d)/g, '_')
				.replace(/(?<=^[^A-Z_]*$)/, '_')}
		/> as estree.Identifier;
	const parameters =
		<object-expression
			properties={[
				<property
					key={<identifier name='layout' /> as estree.Identifier}
					value={<literal value={`${dir}/`.startsWith('src/pages/') ? 'fullscreen' : 'centered'}/> as estree.Literal}
					kind={'init' as const}
				/> as estree.Property,
				...(hasMsw
					? [
							<property
								key={<identifier name='msw' /> as estree.Identifier}
								value={<identifier name='msw' /> as estree.Identifier}
								kind={'init' as const}
								shorthand
							/> as estree.Property,
						]
					: []),
			]}
		/> as estree.ObjectExpression;
	const program =
		<program
			body={[
				<import-declaration
					source={<literal value='@storybook/vue3' /> as estree.Literal}
					specifiers={[
						<import-specifier
							local={<identifier name='Meta' /> as estree.Identifier}
							imported={<identifier name='Meta' /> as estree.Identifier}
						/> as estree.ImportSpecifier,
						...(hasImplStories
							? []
							: [
									<import-specifier
										local={<identifier name='StoryObj' /> as estree.Identifier}
										imported={<identifier name='StoryObj' /> as estree.Identifier}
									/> as estree.ImportSpecifier,
								]),
					]}
					kind={'type'}
				/> as ImportDeclaration,
				...(hasMsw
					? [
							<import-declaration
								source={<literal value={`./${basename(msw)}`} /> as estree.Literal}
								specifiers={[
									<import-namespace-specifier
										local={<identifier name='msw' /> as estree.Identifier}
									/> as estree.ImportNamespaceSpecifier,
								]}
							/> as ImportDeclaration,
						]
					: []),
				...(hasImplStories
					? []
					: [
							<import-declaration
								source={<literal value={`./${base}`} /> as estree.Literal}
								specifiers={[
									<import-default-specifier local={identifier} /> as estree.ImportDefaultSpecifier,
								]}
							/> as ImportDeclaration,
						]),
				...(hasMetaStories
					? [
							<import-declaration
								source={<literal value={`./${basename(metaStories)}`} /> as estree.Literal}
								specifiers={[
									<import-namespace-specifier
										local={<identifier name='storiesMeta' /> as estree.Identifier}
									/> as estree.ImportNamespaceSpecifier,
								]}
							/> as ImportDeclaration,
						]
					: []),
				<variable-declaration
					kind={'const' as const}
					declarations={[
						<variable-declarator
							id={<identifier name='meta' /> as estree.Identifier}
							init={
								<satisfies-expression
									expression={
										<object-expression
											properties={[
												<property
													key={<identifier name='title' /> as estree.Identifier}
													value={literal}
													kind={'init' as const}
												/> as estree.Property,
												<property
													key={<identifier name='component' /> as estree.Identifier}
													value={identifier}
													kind={'init' as const}
												/> as estree.Property,
												...(hasMetaStories
													? [
															<spread-element
																argument={<identifier name='storiesMeta' /> as estree.Identifier}
															/> as estree.SpreadElement,
														]
													: [])
											]}
										/> as estree.ObjectExpression
									}
									reference={<identifier name={`Meta<typeof ${identifier.name}>`} /> as estree.Identifier}
								/> as estree.Expression
							}
						/> as estree.VariableDeclarator,
					]}
				/> as estree.VariableDeclaration,
				...(hasImplStories
					? []
					: [
							<export-named-declaration
								declaration={
									<variable-declaration
										kind={'const' as const}
										declarations={[
											<variable-declarator
												id={<identifier name='Default' /> as estree.Identifier}
												init={
													<satisfies-expression
														expression={
															<object-expression
																properties={[
																	<property
																		key={<identifier name='render' /> as estree.Identifier}
																		value={
																			<function-expression
																				params={[
																					<identifier name='args' /> as estree.Identifier,
																				]}
																				body={
																					<block-statement
																						body={[
																							<return-statement
																								argument={
																									<object-expression
																										properties={[
																											<property
																												key={<identifier name='components' /> as estree.Identifier}
																												value={
																													<object-expression
																														properties={[
																															<property key={identifier} value={identifier} kind={'init' as const} shorthand /> as estree.Property,
																														]}
																													/> as estree.ObjectExpression
																												}
																												kind={'init' as const}
																											/> as estree.Property,
																											<property
																												key={<identifier name='setup' /> as estree.Identifier}
																												value={
																													<function-expression
																														params={[]}
																														body={
																															<block-statement
																																body={[
																																	<return-statement
																																		argument={
																																			<object-expression
																																				properties={[
																																					<property
																																						key={<identifier name='args' /> as estree.Identifier}
																																						value={<identifier name='args' /> as estree.Identifier}
																																						kind={'init' as const}
																																						shorthand
																																					/> as estree.Property,
																																				]}
																																			/> as estree.ObjectExpression
																																		}
																																	/> as estree.ReturnStatement,
																																]}
																															/> as estree.BlockStatement
																														}
																													/> as estree.FunctionExpression
																												}
																												method
																												kind={'init' as const}
																											/> as estree.Property,
																											<property
																												key={<identifier name='computed' /> as estree.Identifier}
																												value={
																													<object-expression
																														properties={[
																															<property
																																key={<identifier name='props' /> as estree.Identifier}
																																value={
																																	<function-expression
																																		params={[]}
																																		body={
																																			<block-statement
																																				body={[
																																					<return-statement
																																						argument={
																																							<object-expression
																																								properties={[
																																									<spread-element
																																										argument={
																																											<member-expression
																																												object={<this-expression /> as estree.ThisExpression}
																																												property={<identifier name='args' /> as estree.Identifier}
																																											/> as estree.MemberExpression
																																										}
																																									/> as estree.SpreadElement,
																																								]}
																																							/> as estree.ObjectExpression
																																						}
																																					/> as estree.ReturnStatement,
																																				]}
																																			/> as estree.BlockStatement
																																		}
																																	/> as estree.FunctionExpression
																																}
																																method
																																kind={'init' as const}
																															/> as estree.Property,
																														]}
																													/> as estree.ObjectExpression
																												}
																												kind={'init' as const}
																											/> as estree.Property,
																											<property
																												key={<identifier name='template' /> as estree.Identifier}
																												value={<literal value={`<${identifier.name} v-bind="props" />`} /> as estree.Literal}
																												kind={'init' as const}
																											/> as estree.Property,
																										]}
																									/> as estree.ObjectExpression
																								}
																							/> as estree.ReturnStatement,
																						]}
																					/> as estree.BlockStatement
																				}
																			/> as estree.FunctionExpression
																		}
																		method
																		kind={'init' as const}
																	/> as estree.Property,
																	<property
																		key={<identifier name='parameters' /> as estree.Identifier}
																		value={parameters}
																		kind={'init' as const}
																	/> as estree.Property,
																]}
															/> as estree.ObjectExpression
														}
														reference={<identifier name={`StoryObj<typeof ${identifier.name}>`} /> as estree.Identifier}
													/> as estree.Expression
												}
											/> as estree.VariableDeclarator,
										]}
									/> as estree.VariableDeclaration
								}
							/> as estree.ExportNamedDeclaration,
						]),
				<export-default-declaration
					declaration={(<identifier name='meta' />) as estree.Identifier}
				/> as estree.ExportDefaultDeclaration,
			]}
		/> as estree.Program;
	return format(
		'/* eslint-disable @typescript-eslint/explicit-function-return-type */\n' +
			'/* eslint-disable import/no-default-export */\n' +
			'/* eslint-disable import/no-duplicates */\n' +
			'/* eslint-disable import/order */\n' +
			generate(program, { generator }) +
			(hasImplStories ? readFileSync(`${implStories}.ts`, 'utf-8') : ''),
		{
			parser: 'babel-ts',
			singleQuote: true,
			useTabs: true,
		}
	);
}

// glob('src/{components,pages,ui,widgets}/**/*.vue')
(async () => {
	const components = [
		globSync('src/components/global/Mk*.vue'),
		globSync('src/components/global/RouterView.vue'),
		globSync('src/components/MkAbuseReportWindow.vue'),
		globSync('src/components/MkAccountMoved.vue'),
		globSync('src/components/MkAchievements.vue'),
		globSync('src/components/MkAnalogClock.vue'),
		globSync('src/components/MkAnimBg.vue'),
		globSync('src/components/MkAnnouncementDialog.vue'),
		globSync('src/components/MkAntennaEditor.vue'),
		globSync('src/components/MkAntennaEditorDialog.vue'),
		globSync('src/components/MkAsUi.vue'),
		globSync('src/components/MkAutocomplete.vue'),
		globSync('src/components/MkAvatars.vue'),
		globSync('src/components/Mk[B-E]*.vue'),
		globSync('src/components/MkFlashPreview.vue'),
		globSync('src/components/MkGalleryPostPreview.vue'),
		globSync('src/components/MkSignupServerRules.vue'),
		globSync('src/components/MkUserSetupDialog.vue'),
		globSync('src/components/MkUserSetupDialog.*.vue'),
		globSync('src/components/MkImgPreviewDialog.vue'),
		globSync('src/components/MkInstanceCardMini.vue'),
		globSync('src/components/MkInviteCode.vue'),
		globSync('src/components/MkTagItem.vue'),
		globSync('src/components/MkRoleSelectDialog.vue'),
		globSync('src/components/grid/MkGrid.vue'),
		globSync('src/pages/admin/custom-emojis-manager2.vue'),
		globSync('src/pages/admin/overview.ap-requests.vue'),
		globSync('src/pages/user/home.vue'),
		globSync('src/pages/search.vue'),
	].flat();
	await Promise.all(components.map(async (component) => {
		const stories = component.replace(/\.vue$/, '.stories.ts');
		await writeFile(stories, await toStories(component));
	}))
})();
