import { Meta, StoryObj } from '@storybook/vue3';
import share from './share.vue';
const meta = {
	title: 'pages/share',
	component: share,
} satisfies Meta<typeof share>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				share,
			},
			props: Object.keys(argTypes),
			template: '<share v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof share>;
export default meta;
