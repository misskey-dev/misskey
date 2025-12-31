import IPCIDR from 'ip-cidr';
import { Redis } from 'ioredis';

const TESTER_IP_ADDRESS = '172.20.1.1';

/**
 * This should be same as {@link file://./../src/misc/get-ip-hash.ts}.
 */
function getIpHash(ip: string) {
	const prefix = IPCIDR.createAddress(ip).mask(64);
	return `ip-${BigInt('0b' + prefix).toString(36)}`;
}

/**
 * This prevents hitting rate limit when login.
 */
export async function purgeLimit(host: string, client: Redis) {
	const ipHash = getIpHash(TESTER_IP_ADDRESS);
	const key = `${host}:limit:${ipHash}:signin`;
	const res = await client.zrange(key, 0, -1);
	if (res.length !== 0) {
		console.log(`${key} - ${JSON.stringify(res)}`);
		await client.del(key);
	}
}

console.log('Daemon started running');

{
	const redisClient = new Redis({
		host: 'redis.test',
	});

	setInterval(() => {
		purgeLimit('a.test', redisClient);
		purgeLimit('b.test', redisClient);
	}, 200);
}
