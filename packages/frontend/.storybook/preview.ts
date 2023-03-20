import { type Preview, setup } from '@storybook/vue3';
import { initialize, mswDecorator } from 'msw-storybook-addon';
import locale from './locale';
import { commonHandlers, onUnhandledRequest } from './mocks';
import theme from './theme';
import '../src/style.scss';

initialize({
	onUnhandledRequest,
});
localStorage.setItem("locale", JSON.stringify(locale));
Promise.all([
	import('../src/components'),
	import('../src/directives'),
	import('../src/widgets'),
	import('../src/scripts/theme').then(({ applyTheme }) => applyTheme(theme)),
]).then(([{ default: components }, { default: directives }, { default: widgets }]) => {
	setup((app) => {
		components(app);
		directives(app);
		widgets(app);
	});
});

const preview = {
	decorators: [
		mswDecorator,
	],
	parameters: {
		msw: {
			handlers: commonHandlers,
		},
	},
} satisfies Preview;

export default preview;
