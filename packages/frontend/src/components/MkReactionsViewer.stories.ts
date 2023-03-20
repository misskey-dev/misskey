import { Meta, StoryObj } from '@storybook/vue3';
import MkReactionsViewer from './MkReactionsViewer.vue';
const meta = {
	title: 'components/MkReactionsViewer',
	component: MkReactionsViewer,
} satisfies Meta<typeof MkReactionsViewer>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkReactionsViewer,
			},
			props: Object.keys(argTypes),
			template: '<MkReactionsViewer v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkReactionsViewer>;
export default meta;
