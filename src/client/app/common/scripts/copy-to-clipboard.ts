/**
 * Clipboardに値をコピー(TODO: 文字列以外も対応)
 */
export default val => {
	const form = document.createElement('textarea');
	form.textContent = val;
	document.body.appendChild(form);
	form.select();
	const result = document.execCommand('copy');
	document.body.removeChild(form);

	return result;
};
