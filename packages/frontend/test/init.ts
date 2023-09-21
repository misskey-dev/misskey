import { vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

// Set i18n
import locales from '../../../locales';
import { updateI18n } from '@/i18n';
updateI18n(locales['en-US']);

// XXX: misskey-js panics if WebSocket is not defined
vi.stubGlobal('WebSocket', class WebSocket extends EventTarget { static CLOSING = 2; });

// XXX: defaultStore somehow becomes undefined in vitest?
vi.mock('@/store.js', () => {
	return {
		defaultStore: {
			state: {},
		},
	};
});
