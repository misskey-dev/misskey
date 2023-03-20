import { Meta, StoryObj } from '@storybook/vue3';
import registry from './registry.vue';
const meta = {
	title: 'pages/registry',
	component: registry,
} satisfies Meta<typeof registry>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				registry,
			},
			props: Object.keys(argTypes),
			template: '<registry v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof registry>;
export default meta;
