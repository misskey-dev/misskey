import { secureRndstr } from '@/misc/secure-rndstr.js';

export default () => secureRndstr(16, true);
