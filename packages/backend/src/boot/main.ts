import {
	AggregateError,
	Envs,
	WebAppOptions,
	addSingletonCtor,
	createWebAppBuilder,
	inject,
} from 'yohira';

class A {
	constructor(@inject(Symbol.for('A')) private readonly a: A) {}
}

export async function main(): Promise<void> {
	try {
		const options = new WebAppOptions();
		options.envName = Envs.Development;
		const builder = createWebAppBuilder(options);

		addSingletonCtor(builder.services, Symbol.for('A'), A);

		const app = builder.build();

		await app.run();
	} catch (error) {
		if (error instanceof AggregateError) {
			const messages: string[] = [];
			messages.push(error.message);
			for (const innerError of error.errors) {
				if (innerError instanceof Error) {
					messages.push(innerError.message);
				} else {
					messages.push(innerError);
				}
			}
			console.error(messages.join('\n'));
		} else {
			throw error;
		}
	}
}
