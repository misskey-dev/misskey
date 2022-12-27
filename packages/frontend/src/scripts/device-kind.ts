import { defaultStore } from '@/store';

const ua = navigator.userAgent.toLowerCase();
const isTablet = /ipad/.test(ua) || (/mobile|iphone|android/.test(ua) && window.innerWidth > 700);
const isSmartphone = !isTablet && /mobile|iphone|android/.test(ua);

export const deviceKind = defaultStore.state.overridedDeviceKind ? defaultStore.state.overridedDeviceKind
	: isSmartphone ? 'smartphone'
	: isTablet ? 'tablet'
	: 'desktop';
