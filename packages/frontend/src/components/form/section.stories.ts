import { Meta, Story } from '@storybook/vue3';
import section from './section.vue';
const meta = {
	title: 'components/form/section',
	component: section,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				section,
			},
			props: Object.keys(argTypes),
			template: '<section v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
