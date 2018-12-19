import parse from '../mfm/parse';
import { Node, IMentionNode } from '../mfm/parser';

export default function(tokens: ReturnType<typeof parse>): IMentionNode['props'][] {
	const mentions: IMentionNode['props'][] = [];

	const extract = (tokens: Node[]) => {
		for (const x of tokens.filter(x => x.name === 'mention')) {
			mentions.push(x.props);
		}
		for (const x of tokens.filter(x => x.children)) {
			extract(x.children);
		}
	};

	extract(tokens);

	return mentions;
}
