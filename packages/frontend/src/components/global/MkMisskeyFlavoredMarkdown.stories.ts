import { Meta, Story } from '@storybook/vue3';
import MkMisskeyFlavoredMarkdown from './MkMisskeyFlavoredMarkdown.vue';
const meta = {
	title: 'components/global/MkMisskeyFlavoredMarkdown',
	component: MkMisskeyFlavoredMarkdown,
};
export const Default = {
	components: {
		MkMisskeyFlavoredMarkdown,
	},
	template: '<MkMisskeyFlavoredMarkdown />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
