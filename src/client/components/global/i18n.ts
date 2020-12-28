import { h, defineComponent } from 'vue';

export default defineComponent({
	props: {
		src: {
			type: String,
			required: true,
		},
		tag: {
			type: String,
			required: false,
			default: 'span',
		},
	},
	render() {
		let str = this.src;
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
					arg: str.substring(nextBracketOpen + 1, nextBracketClose)
				});
			}

			str = str.substr(nextBracketClose + 1);
		}

		return h(this.tag, parsed.map(x => typeof x === 'string' ? x : this.$slots[x.arg]()));
	}
});
