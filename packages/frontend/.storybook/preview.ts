import { addons } from '@storybook/addons';
import { FORCE_REMOUNT } from '@storybook/core-events';
import { type Preview, forceReRender, setup } from '@storybook/vue3';
import { initialize, mswDecorator } from 'msw-storybook-addon';
import locale from './locale';
import { commonHandlers, onUnhandledRequest } from './mocks';
import themes from './themes';
import '../src/style.scss';

let initialized = false;
let unobserve = () => {};

function loadTheme(applyTheme: typeof import('../src/scripts/theme')['applyTheme']) {
	unobserve();
	const theme = themes[document.documentElement.dataset.misskeyTheme];
	if (theme) {
		applyTheme(themes[document.documentElement.dataset.misskeyTheme]);
	}
	const observer = new MutationObserver((entries) => {
		for (const entry of entries) {
			if (entry.attributeName === 'data-misskey-theme') {
				const target = entry.target as HTMLElement;
				const theme = themes[target.dataset.misskeyTheme];
				if (theme) {
					applyTheme(themes[target.dataset.misskeyTheme]);
				} else {
					target.removeAttribute('style');
				}
			}
		}
	});
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['data-misskey-theme'],
	});
	unobserve = () => observer.disconnect();
}

initialize({
	onUnhandledRequest,
});
localStorage.setItem("locale", JSON.stringify(locale));
queueMicrotask(() => {
	Promise.all([
		import('../src/components'),
		import('../src/directives'),
		import('../src/widgets'),
		import('../src/scripts/theme'),
	]).then(([{ default: components }, { default: directives }, { default: widgets }, { applyTheme }]) => {
		setup((app) => {
			initialized = true;
			loadTheme(applyTheme);
			components(app);
			directives(app);
			widgets(app);
		});
	});
});

const preview = {
	decorators: [
		mswDecorator,
		(Story, context) => {
			const story = Story();
			if (!initialized) {
				const channel = addons.getChannel();
				requestIdleCallback(() => {
					channel.emit(FORCE_REMOUNT, { storyId: context.id });
				});
			}
			return story;
		}
	],
	parameters: {
		msw: {
			handlers: commonHandlers,
		},
	},
} satisfies Preview;

export default preview;
