import { h } from 'vue';

export default function(props: { src: string; tag?: string; textTag?: string; }, { slots }) {
	let str = props.src;
	const parsed = [] as (string | { arg: string; })[];
	while (true) {
		const nextBracketOpen = str.indexOf('{');
		const nextBracketClose = str.indexOf('}');

		if (nextBracketOpen === -1) {
			parsed.push(str);
			break;
		} else {
			if (nextBracketOpen > 0) parsed.push(str.substr(0, nextBracketOpen));
			parsed.push({
				arg: str.substring(nextBracketOpen + 1, nextBracketClose),
			});
		}

		str = str.substr(nextBracketClose + 1);
	}

	return h(props.tag ?? 'span', parsed.map(x => typeof x === 'string' ? (props.textTag ? h(props.textTag, x) : x) : slots[x.arg]()));
}
