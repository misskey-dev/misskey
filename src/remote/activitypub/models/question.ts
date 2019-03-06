import { IChoice, IPoll } from '../../../models/note';
import Resolver from '../resolver';
import { ICollection } from '../type';

interface IQuestionChoice {
	name?: string;
	replies?: ICollection;
	_misskey_votes?: number;
}

interface IQuestion {
	oneOf?: IQuestionChoice[];
	anyOf?: IQuestionChoice[];
	endTime?: Date;
}

export async function extractPollFromQuestion(source: string | IQuestion): Promise<IPoll> {
	const question = typeof source === 'string' ? await new Resolver().resolve(source) as IQuestion : source;
	const multiple = !question.oneOf;
	const expiresAt = question.endTime ? new Date(question.endTime) : null;

	if (multiple && !question.anyOf) {
		throw 'invalid question';
	}

	const choices = question[multiple ? 'anyOf' : 'oneOf']
		.map((x, i) => ({
			id: i,
			text: x.name,
			votes: x.replies && x.replies.totalItems || x._misskey_votes || 0,
		} as IChoice));

	return {
		choices,
		multiple,
		expiresAt
	};
}
