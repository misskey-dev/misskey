import { existsSync, readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { basename, dirname } from 'node:path/posix';
import { promisify } from 'node:util';
import { GENERATOR, type State, generate } from 'astring';
import type * as estree from 'estree';
import * as glob from 'glob';
import { format } from 'prettier';

interface SatisfiesExpression extends estree.BaseExpression {
	type: 'SatisfiesExpression';
	expression: estree.Expression;
	reference: estree.Identifier;
}

const generator = {
	...GENERATOR,
	SatisfiesExpression(node: SatisfiesExpression, state: State) {
		if (node.expression.type === 'ArrowFunctionExpression') {
			state.write('(');
			this[node.expression.type](node.expression, state);
			state.write(')');
		} else {
			this[node.expression.type](node.expression, state);
		}
		state.write(' satisfies ');
		this[node.reference.type](node.reference, state);
	},
}

function h<T extends estree.Node>(component: T['type'], props: Omit<T, 'type'>): T {
	const type = component.replace(/(?:^|-)([a-z])/g, (_, c) => c.toUpperCase());
	return Object.assign(props, { type }) as T;
}

function toStories(component: string): string {
	const msw = `${component.slice(0, -'.vue'.length)}.msw`;
	const implStories = `${component.slice(0, -'.vue'.length)}.stories.impl`;
	const hasMsw = existsSync(`${msw}.ts`);
	const hasImplStories = existsSync(`${implStories}.ts`);
	const base = basename(component);
	const dir = dirname(component);
	const literal = (
		<literal value={component.slice('src/'.length, -'.vue'.length)} />
	) as unknown as estree.Literal;
	const identifier = (
		<identifier name={base.slice(0, -'.vue'.length).replace(/[-.]|^(?=\d)/g, '_')} />
	) as unknown as estree.Identifier;
	const parameters = (
		<object-expression
			properties={[
				<property
					key={<identifier name="layout" />}
					value={<literal value={`${dir}/`.startsWith('src/pages/') ? 'fullscreen' : 'centered'} />}
					kind="init"
				/>,
				...hasMsw
					? [
							<property
								key={<identifier name="msw" />}
								value={<identifier name="msw" />}
								kind="init"
								shorthand
							/>,
						]
					: [],
			]}
		/>
	);
	const program = (
		<program
			body={[
				<import-declaration
					source={<literal value="@storybook/vue3" />}
					specifiers={[
						<import-specifier
							local={<identifier name="Meta" />}
							imported={<identifier name="Meta" />}
						/>,
						...hasImplStories
							? []
							: [
									<import-specifier
										local={<identifier name="StoryObj" />}
										imported={<identifier name="StoryObj" />}
									/>,
								],
					]}
				/>,
				...hasMsw
					? [
							<import-declaration
								source={<literal value={`./${basename(msw)}`} />}
								specifiers={[
									<import-namespace-specifier
										local={<identifier name="msw" />}
									/>,
								]}
							/>,
						]
					: [],
				...hasImplStories
					? []
					: [
							<import-declaration
								source={<literal value={`./${base}`} />}
								specifiers={[
									<import-default-specifier
										local={identifier}
										imported={identifier}
									/>,
								]}
							/>,
						],
				<variable-declaration
					kind="const"
					declarations={[
						<variable-declarator
							id={<identifier name="meta" />}
							init={
								<satisfies-expression
									expression={
										<object-expression
											properties={[
												<property
													key={<identifier name="title" />}
													value={literal}
													kind="init"
												/>,
												<property
													key={<identifier name="component" />}
													value={identifier}
													kind="init"
												/>,
											]}
										/>
									}
									reference={<identifier name={`Meta<typeof ${identifier.name}>`} />}
								/>
							}
						/>,
					]}
				/>,
				...hasImplStories
					? [
						]
					: [
							<export-named-declaration
								declaration={
									<variable-declaration
										kind="const"
										declarations={[
											<variable-declarator
												id={<identifier name="Default" />}
												init={
													<satisfies-expression
														expression={
															<object-expression
																properties={[
																	<property
																		key={<identifier name="render" />}
																		value={
																			<function-expression
																				id={<identifier name="render" />}
																				params={[
																					<identifier name="args" />,
																					<object-pattern
																						properties={[
																							<property
																								key={<identifier name="argTypes" />}
																								value={<identifier name="argTypes" />}
																								kind="init"
																								shorthand
																							/>,
																						]}
																					/>,
																				]}
																				body={
																					<block-statement
																						body={[
																							<return-statement
																								argument={
																									<object-expression
																										properties={[
																											<property
																												key={<identifier name="components" />}
																												value={
																													<object-expression
																														properties={[
																															<property
																																key={identifier}
																																value={identifier}
																																kind="init"
																																shorthand
																															/>,
																														]}
																													/>
																												}
																												kind="init"
																											/>,
																											<property
																												key={<identifier name="props" />}
																												value={
																													<call-expression
																														callee={
																															<member-expression
																																object={<identifier name="Object" />}
																																property={<identifier name="keys" />}
																															/>
																														}
																														arguments={[
																															<identifier name="argTypes" />,
																														]}
																													/>
																												}
																												kind="init"
																											/>,
																											<property
																												key={<identifier name="template" />}
																												value={<literal value={`<${identifier.name} v-bind="$props" />`} />}
																												kind="init"
																											/>,
																										]}
																									/>
																								}
																							/>,
																						]}
																					/>
																				}
																			/>
																		}
																		method
																		kind="init"
																	/>,
																	<property
																		key={<identifier name="parameters" />}
																		value={parameters}
																		kind="init"
																	/>,
																]}
															/>
														}
														reference={<identifier name={`StoryObj<typeof ${identifier.name}>`} />}
													/>
												}
											/>,
										]}
									/>
								}
							/>,
						],
				<export-default-declaration
					declaration={<identifier name="meta" />}
				/>,
			]}
		/>
	) as unknown as estree.Program;
	return format(
		generate(program, { generator }) + (hasImplStories ? readFileSync(`${implStories}.ts`, 'utf-8') : ''),
		{
			parser: 'babel-ts',
			singleQuote: true,
			useTabs: true,
		}
	);
}

promisify(glob)('src/{components,pages,ui,widgets}/**/*.vue').then((components) => Promise.all(
	components.map((component) => {
		const stories = component.replace(/\.vue$/, '.stories.ts');
		return writeFile(stories, toStories(component));
	})
));
