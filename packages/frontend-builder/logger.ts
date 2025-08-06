
const debug = false;
export type Logger = ReturnType<typeof loggerFactory>;

export function loggerFactory(prefix: string) {
	return {
		debug: (message: string) => void (debug && console.log(`[DBG] ${prefix}${message}`)),
		warn: (message: string) => console.log(`${debug ? '[WRN]' : 'w:'} ${prefix}${message}`),
		error: (message: string) => console.error(`${debug ? '[ERR]' : 'e:'} ${prefix}${message}`),
		info: (message: string) => console.error(`${debug ? '[INF]' : 'i:'} ${prefix}${message}`),
		prefixed: (newPrefix: string) => loggerFactory(`${prefix}${newPrefix}`),
	};
}

export const blankLogger: Logger = {
	debug: () => void 0,
	warn: () => void 0,
	error: () => void 0,
	info: () => void 0,
	prefixed: () => blankLogger,
}
