const WebFinger = require('webfinger.js');

const webFinger = new WebFinger({ });

type ILink = {
	href: string;
	rel: string;
};

type IWebFinger = {
	links: ILink[];
	subject: string;
};

export default async function resolve(query: any): Promise<IWebFinger> {
	return await new Promise((res, rej) => webFinger.lookup(query, (error: Error, result: any) => {
		if (error) {
			return rej(error);
		}

		res(result.object);
	})) as IWebFinger;
}
