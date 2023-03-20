import { Meta, StoryObj } from '@storybook/vue3';
import tag from './tag.vue';
const meta = {
	title: 'pages/tag',
	component: tag,
} satisfies Meta<typeof tag>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				tag,
			},
			props: Object.keys(argTypes),
			template: '<tag v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof tag>;
export default meta;
