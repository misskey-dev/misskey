export default acct => {
	const splitted = acct.split('@', 2);
	return { username: splitted[0], host: splitted[1] || null };
};
