import { Meta, StoryObj } from '@storybook/vue3';
import MkModalWindow from './MkModalWindow.vue';
const meta = {
	title: 'components/MkModalWindow',
	component: MkModalWindow,
} satisfies Meta<typeof MkModalWindow>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkModalWindow,
			},
			props: Object.keys(argTypes),
			template: '<MkModalWindow v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkModalWindow>;
export default meta;
