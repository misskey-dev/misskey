import { Meta, StoryObj } from '@storybook/vue3';
import section_ from './section.vue';
const meta = {
	title: 'components/form/section',
	component: section_,
} satisfies Meta<typeof section_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				section_,
			},
			props: Object.keys(argTypes),
			template: '<section_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof section_>;
export default meta;
