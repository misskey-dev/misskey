function uhoize(str) {
	const punctuation = ['。', '！', '？', '.', '!', '?'];
	let lines = str.split('\n');
	let voice = 'ウホ';
	return lines.map(line => {
		if (Math.floor(Math.random() * 2) === 0) {
			voice = 'ウホッ'
		} else {
			voice = 'ウホ'
		}
		let lastChar = line.trim().slice(-1);
		if (punctuation.includes(lastChar)) {
			let lineWithoutPunctuation = line.trim().slice(0, -1);
			return lineWithoutPunctuation + voice + lastChar;
		} else {
			return line + voice;
		}
	}).join('\n');
}
/*
export function uhoize(text) {
	const gorillaNoises = ['ウホ', 'ウホホ', 'ウホッ'];
	let result = '';
	let noiseIndex = 0;
	for (let i = 0; i < text.length; i++) {
		if (!(/[、。.,\/#!$%\^&\*;:{}=\-_`~()]/.test(text[i]))) {
			if (/[^\x00-\x7F]/.test(text[i])) {
				noiseIndex =  Math.floor(Math.random() * 3);
				const japaneseNoises = ['ウホ', 'ウホホ', 'ウホッ'];
				result += japaneseNoises[noiseIndex];
			} else {
				noiseIndex = Math.floor(Math.random() * 2);
				const englishNoises = ['uho', 'uhoho'];
				result += englishNoises[noiseIndex];
			}
		}else{
			result += text[i];
		}
		if (text.length*1.3 < result.length) return result

	}
	return result;
}
*/
