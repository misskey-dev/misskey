import { Meta, StoryObj } from '@storybook/vue3';
import MkTokenGenerateWindow from './MkTokenGenerateWindow.vue';
const meta = {
	title: 'components/MkTokenGenerateWindow',
	component: MkTokenGenerateWindow,
} satisfies Meta<typeof MkTokenGenerateWindow>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkTokenGenerateWindow,
			},
			props: Object.keys(argTypes),
			template: '<MkTokenGenerateWindow v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkTokenGenerateWindow>;
export default meta;
