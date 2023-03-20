import { Meta, StoryObj } from '@storybook/vue3';
import statusbar_federation from './statusbar-federation.vue';
const meta = {
	title: 'ui/_common_/statusbar-federation',
	component: statusbar_federation,
} satisfies Meta<typeof statusbar_federation>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				statusbar_federation,
			},
			props: Object.keys(argTypes),
			template: '<statusbar_federation v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof statusbar_federation>;
export default meta;
