import { Meta, StoryObj } from '@storybook/vue3';
import statusbars from './statusbars.vue';
const meta = {
	title: 'ui/_common_/statusbars',
	component: statusbars,
} satisfies Meta<typeof statusbars>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				statusbars,
			},
			props: Object.keys(argTypes),
			template: '<statusbars v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof statusbars>;
export default meta;
