import { Meta, Story } from '@storybook/vue3';
import MkLink from './MkLink.vue';
const meta = {
	title: 'components/MkLink',
	component: MkLink,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkLink,
			},
			props: Object.keys(argTypes),
			template: '<MkLink v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
