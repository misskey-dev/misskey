const faces = [
	'(=^・・^=)',
	'v(\'ω\')v',
	'🐡( \'-\' 🐡 )ﾌｸﾞﾊﾟﾝﾁ!!!!',
	'🖕(´･_･`)🖕',
	'(｡>﹏<｡)',
	'(Δ・x・Δ)'
];

export default () => faces[Math.floor(Math.random() * faces.length)];
