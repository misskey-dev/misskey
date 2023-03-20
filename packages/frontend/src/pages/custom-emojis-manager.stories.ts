import { Meta, StoryObj } from '@storybook/vue3';
import custom_emojis_manager from './custom-emojis-manager.vue';
const meta = {
	title: 'pages/custom-emojis-manager',
	component: custom_emojis_manager,
} satisfies Meta<typeof custom_emojis_manager>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				custom_emojis_manager,
			},
			props: Object.keys(argTypes),
			template: '<custom_emojis_manager v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof custom_emojis_manager>;
export default meta;
