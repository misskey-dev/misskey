import { HashtagNode, MfmForest } from '~/mfm/prelude';
import { preorderF } from '~/prelude/tree';
import { unique } from '~/prelude/array';

export default function(mfmForest: MfmForest): string[] {
	const hashtagNodes = preorderF(mfmForest).filter(x => x.type === 'hashtag') as HashtagNode[];
	const hashtags = hashtagNodes.map(x => x.props.hashtag);
	return unique(hashtags);
}
