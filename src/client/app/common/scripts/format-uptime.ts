
/**
 * Format like the uptime command
 */
export default function(sec) {
	if (!sec) return sec;

	const day = Math.floor(sec / 86400);
	const tod = sec % 86400;

	// Days part in string: 2 days, 1 day, null
	const d = day >= 2 ? `${day} days` : day >= 1 ? `${day} day` : null;

	// Time part in string: 1 sec, 1 min, 1:01
	const t
		= tod < 60 ? `${Math.floor(tod)} sec`
		: tod < 3600 ? `${Math.floor(tod / 60)} min`
		: `${Math.floor(tod / 60 / 60)}:${Math.floor((tod / 60) % 60).toString().padStart(2, '0')}`;

	let str = '';
	if (d) str += `${d}, `;
	str += t;

	return str;
}
