import { Meta, StoryObj } from '@storybook/vue3';
import classic_ from './classic.vue';
const meta = {
	title: 'ui/classic',
	component: classic_,
} satisfies Meta<typeof classic_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				classic_,
			},
			props: Object.keys(argTypes),
			template: '<classic_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof classic_>;
export default meta;
