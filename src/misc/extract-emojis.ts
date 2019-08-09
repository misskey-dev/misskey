import { EmojiNode, MfmForest } from '~/mfm/prelude';
import { preorderF } from '~/prelude/tree';
import { unique } from '~/prelude/array';

export default function(mfmForest: MfmForest): string[] {
	const emojiNodes = preorderF(mfmForest).filter(x => x.type === 'emoji') as EmojiNode[];
	const emojis = emojiNodes.filter(x => x.props.name && x.props.name.length <= 100).map(x => x.props.name);
	return unique(emojis);
}
