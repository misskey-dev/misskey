import * as fs from 'node:fs/promises';
import { basename, dirname, join } from 'node:path/posix';
import { promisify } from 'node:util';
import { generate } from 'astring';
import type * as estree from 'estree';
import * as glob from 'glob';
import { format } from 'prettier';

function h<T extends estree.Node>(component: T['type'], props: Omit<T, 'type'>): T {
	const type = component.replace(/(?:^|-)([a-z])/g, (_, c) => c.toUpperCase());
	return Object.assign(props, { type }) as T;
}

function toStories(component: string): string {
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
					value={<literal value={`${dir}/`.startsWith('src/pages/') || base === 'MkAnalogClock.vue' ? 'fullscreen' : 'centered'} />}
					kind="init"
				/>
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
						<import-specifier
							local={<identifier name="Story" />}
							imported={<identifier name="Story" />}
						/>,
					]}
				/>,
				<import-declaration
					source={<literal value={`./${base}`} />}
					specifiers={[
						<import-default-specifier
							local={identifier}
							imported={identifier}
						/>,
					]}
				/>,
				<variable-declaration
					kind="const"
					declarations={[
						<variable-declarator
							id={<identifier name="meta" />}
							init={
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
						/>,
					]}
				/>,
				<export-named-declaration
					declaration={
						<variable-declaration
							kind="const"
							declarations={[
								<variable-declarator
									id={<identifier name="Default" />}
									init={
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
													key={<identifier name="template" />}
													value={<literal value={`<${identifier.name} />`} />}
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
								/>,
							]}
						/>
					}
				/>,
				<export-default-declaration
					declaration={<identifier name="meta" />}
				/>,
			]}
		/>
	) as unknown as estree.Program;
	return format(
		generate(program),
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
		fs.stat(stories).then(
			() => {},
			() => {
				fs.writeFile(stories, toStories(component));
			}
		);
	})
));
