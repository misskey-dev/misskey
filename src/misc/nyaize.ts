export function nyaize(text: string): string {
	return text
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
