import rndstr from 'rndstr';

export function nyaize(text: string): string {
	const [toNyaize, exclusionMap] = exclude(text);
	const nyaized = toNyaize
		// ja-JP
		.replace(/な/g, 'にゃ').replace(/ナ/g, 'ニャ').replace(/ﾅ/g, 'ﾆｬ')
		// en-US
		.replace(/morning/gi, 'mornyan').replace(/everyone/gi, 'everynyan')
		.replace(/o/g, 'owo').replace(/u/g, 'uwu')
		// ko-KR
		.replace(/[나-낳]/g, match => String.fromCharCode(
			match.charCodeAt(0)! + '냐'.charCodeAt(0) - '나'.charCodeAt(0)
		)).replace(/(다$)|(다(?=\.))|(다(?= ))|(다(?=!))|(다(?=\?))/gm, '다냥')
		.replace(/(야(?=\?))|(야$)|(야(?= ))/gm, '냥');
	return replaceExceptions(nyaized, exclusionMap);
}

export function denyaize(text: string): string {
	return text
		.replace(/にゃ/g, 'な').replace(/ニャ/g, 'ナ').replace(/ﾆｬ/g, 'ﾅ')
		.replace(/owo/g, 'o').replace(/uwu/g, 'u')
		.replace(/mornyan/gi, 'morning').replace(/everynyan/gi, 'everyone') // this will result in case related bug
		.replace(/(다냥$)|(다냥(?=\.))|(다냥(?= ))|(다냥(?=!))|(다냥(?=\?))/gm, '다')
		.replace(/(냥(?=\?))|(냥$)|(냥(?= ))/gm, '야')
		.replace(/[냐-냫]/g, match => String.fromCharCode(
			match.charCodeAt(0)! + '나'.charCodeAt(0) - '냐'.charCodeAt(0)
		));
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
		.replace(/(https?:\/\/.*?)(?= |$)/gm, match => substitute(match)) // URL
		.replace(/:([a-z0-9_+-]+):/gim, match => substitute(match)) // emoji
		.replace(/#([^\s.,!?'"#:\/\[\]【】]+)/gm, match => substitute(match)) // hashtag
		.replace(/@\w([\w-]*\w)?(?:@[\w.\-]+\w)?/gm, match => substitute(match)) // mention
		.replace(/<\/?[a-zA-Z]*?>/g, match => substitute(match)) // <jump>, <motion>, etc.
		.replace(/`([^`\n]+?)`/g, match => substitute(match)) // inline code
		.replace(/```(.+?)?\n([\s\S]+?)```(\n|$)/gm, match => substitute(match)); // code block
	return [replaced, map];
}

function replaceExceptions(text: string, map: Record<string, string>): string {	
	for(const rule in map)
		if(Object.prototype.hasOwnProperty.call(map, rule))
			text = text.replace(rule, map[rule]);
	return text;
}