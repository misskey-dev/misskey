import parser, { Node } from './parser';
import * as A from '../prelude/array';
import * as S from '../prelude/string';

export default (source: string): Node[] => {
	if (source == null || source == '') {
		return null;
	}

	const nodes: Node[] = parser.root.tryParse(source);

	const combineText = (es: Node[]): Node =>
		({ name: 'text', props: { text: S.concat(es.map(e => e.props.text)) } });

	const concat = (es: Node[]): void =>
		es.filter(x => x.children).forEach(x => {
			x.children = A.concat(A.groupOn(x => x.name, nodes).map(es =>
				es[0].name === 'text' ? [combineText(es)] : es
			));
		});

	concat(nodes);

	return nodes;
};
