// https://vitejs.dev/config/build-options.html#build-modulepreload
import 'vite/modulepreload-polyfill';

import '@/style.scss';
import { mainBoot } from './boot/main-boot';
import { subBoot } from './boot/sub-boot';

if (['/share', '/auth', '/miauth'].includes(location.pathname)) {
	subBoot();
} else {
	mainBoot();
}
