import { Meta, StoryObj } from '@storybook/vue3';
import overview from './overview.vue';
const meta = {
	title: 'pages/admin/overview',
	component: overview,
} satisfies Meta<typeof overview>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				overview,
			},
			props: Object.keys(argTypes),
			template: '<overview v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof overview>;
export default meta;
