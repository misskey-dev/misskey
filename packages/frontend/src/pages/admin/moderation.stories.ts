import { Meta, StoryObj } from '@storybook/vue3';
import moderation from './moderation.vue';
const meta = {
	title: 'pages/admin/moderation',
	component: moderation,
} satisfies Meta<typeof moderation>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				moderation,
			},
			props: Object.keys(argTypes),
			template: '<moderation v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof moderation>;
export default meta;
