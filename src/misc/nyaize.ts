import rndstr from 'rndstr';

export function nyaize(text: string): string {
	return text
		// ja-JP
		.replace(/な/g, 'にゃ').replace(/ナ/g, 'ニャ').replace(/ﾅ/g, 'ﾆｬ')
		// en-US
		.replace(/morning/gi, 'mornyan').replace(/everyone/gi, 'everynyan')
		// ko-KR
		.replace(/[나-낳]/g, match => String.fromCharCode(
			match.charCodeAt(0)! + '냐'.charCodeAt(0) - '나'.charCodeAt(0)
		))
		.replace(/(다$)|(다(?=\.))|(다(?= ))|(다(?=!))|(다(?=\?))/gm, '다냥')
		.replace(/(야(?=\?))|(야$)|(야(?= ))/gm, '냥');
}

function exclude(text: string): [string, Record<string, string>] {
	const map: Record<string, string> = {};
	function substitute(match: string): string {
		let randomstr: string;
		do {
			randomstr = rndstr({ length: 16, chars: '🀀-🀫' });
		} while(Object.prototype.hasOwnProperty.call(map, randomstr));
		map[randomstr] = match;
		return randomstr;
	}
	const replaced = text
		.replace(/```(.+?)?\n([\s\S]+?)```(\n|$)/gm, match => substitute(match)) // code block
		.replace(/`([^`\n]+?)`/g, match => substitute(match)) // inline code
		.replace(/(https?:\/\/.*?)(?= |$)/gm, match => substitute(match)) // URL
		.replace(/:([a-z0-9_+-]+):/gim, match => substitute(match)) // emoji
		.replace(/#([^\s.,!?'"#:\/\[\]【】]+)/gm, match => substitute(match)) // hashtag
		.replace(/@\w([\w-]*\w)?(?:@[\w.\-]+\w)?/gm, match => substitute(match)) // mention
		.replace(/^>[^\n]+/gm, match => substitute(match)); // quote
	return [replaced, map];
}

function replaceExceptions(text: string, map: Record<string, string>): string {
	for (const rule in map) {
		if (Object.prototype.hasOwnProperty.call(map, rule)) {
			text = text.replace(rule, map[rule]);
		}
	}
	return text;
}
