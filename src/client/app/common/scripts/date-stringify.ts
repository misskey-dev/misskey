export default date => {
	if (typeof date == 'string') date = new Date(date);
	return (
		date.getFullYear()    + '%i18n:common.date.full-year%' +
		(date.getMonth() + 1) + '%i18n:common.date.month%' +
		date.getDate()        + '%i18n:common.date.day%' +
		' ' +
		date.getHours()       + '%i18n:common.date.hours%' +
		date.getMinutes()     + '%i18n:common.date.minutes%' +
		' ' +
		`(${['日', '月', '火', '水', '木', '金', '土'][date.getDay()]})`
	);
};
