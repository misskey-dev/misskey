import { Meta, Story } from '@storybook/vue3';
import MkMisskeyFlavoredMarkdown from './MkMisskeyFlavoredMarkdown.vue';
const meta = {
	title: 'components/global/MkMisskeyFlavoredMarkdown',
	component: MkMisskeyFlavoredMarkdown,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkMisskeyFlavoredMarkdown,
			},
			props: Object.keys(argTypes),
			template: '<MkMisskeyFlavoredMarkdown v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
