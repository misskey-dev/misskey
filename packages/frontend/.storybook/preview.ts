import { type Preview, setup } from '@storybook/vue3';
import locale from './locale';
import theme from './theme';
import '../src/style.scss';

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
})

const preview = {
	parameters: {
		layout: 'centered',
	},
} satisfies Preview;

export default preview;
