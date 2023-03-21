import { Meta, StoryObj } from '@storybook/vue3';
import statusbars_ from './statusbars.vue';
const meta = {
	title: 'ui/_common_/statusbars',
	component: statusbars_,
} satisfies Meta<typeof statusbars_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				statusbars_,
			},
			props: Object.keys(argTypes),
			template: '<statusbars_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof statusbars_>;
export default meta;
