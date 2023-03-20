import { Meta, StoryObj } from '@storybook/vue3';
import sounds from './sounds.vue';
const meta = {
	title: 'pages/settings/sounds',
	component: sounds,
} satisfies Meta<typeof sounds>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				sounds,
			},
			props: Object.keys(argTypes),
			template: '<sounds v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof sounds>;
export default meta;
