import type { Preview } from '@storybook/vue3';
import { applyTheme } from '../src/scripts/theme';
import theme from './theme';
import '../src/style.scss';

applyTheme(theme);

const preview = {
	parameters: {
		layout: 'centered',
	},
} satisfies Preview;

export default preview;
