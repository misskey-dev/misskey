export default date => {
	if (typeof date == 'string') date = new Date(date);
	return (
		date.getFullYear()    + '年' +
		(date.getMonth() + 1) + '月' +
		date.getDate()        + '日' +
		' ' +
		date.getHours()       + '時' +
		date.getMinutes()     + '分' +
		' ' +
		`(${['日', '月', '火', '水', '木', '金', '土'][date.getDay()]})`
	);
};
