// https://vitejs.dev/config/build-options.html#build-modulepreload
import 'vite/modulepreload-polyfill';

import '@/style.scss';
import { mainBoot } from './boot/main-boot';
import { subBoot } from './boot/sub-boot';

const subBootPaths = ['/share', '/auth', '/miauth', '/signup-complete'];

if (subBootPaths.some(i => location.pathname === i || location.pathname.startsWith(i + '/'))) {
	subBoot();
} else {
	mainBoot();
}
