import { IChoice, IPoll } from '../../../models/note';
import Resolver from '../resolver';

export async function extractPollFromQuestion(questionUri: string): Promise<IPoll> {
	const resolver = new Resolver();
	const question = await resolver.resolve(questionUri) as any;

	const choices: IChoice[] = question.oneOf.map((x: any, i: number) => {
			return {
				id: i,
				text: x.name,
				votes: x._misskey_votes || 0,
			} as IChoice;
	});

	return {
		choices
	};
}
