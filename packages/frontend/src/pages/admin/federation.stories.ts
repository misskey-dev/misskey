import { Meta, StoryObj } from '@storybook/vue3';
import federation_ from './federation.vue';
const meta = {
	title: 'pages/admin/federation',
	component: federation_,
} satisfies Meta<typeof federation_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				federation_,
			},
			props: Object.keys(argTypes),
			template: '<federation_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof federation_>;
export default meta;
