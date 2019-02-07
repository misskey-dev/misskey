declare module '*/package.json' {
	interface IRepository {
		type: string;
		url: string;
	}

	export const name: string;
	export const version: string;
	export const repository: IRepository;
}
