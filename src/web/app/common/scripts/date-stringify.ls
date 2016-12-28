module.exports = (date) ->
	if typeof date == \string then date = new Date date

	text =
		date.get-full-year! + \年 +
		date.get-month!     + \月 +
		date.get-date!      + \日 +
		' ' +
		date.get-hours!     + \時 +
		date.get-minutes!   + \分 +
		' ' +
		"(#{[\日 \月 \火 \水 \木 \金 \土][date.get-day!]})"

	return text
