import { Meta, StoryObj } from '@storybook/vue3';
import MkUserName from './MkUserName.vue';
const meta = {
	title: 'components/global/MkUserName',
	component: MkUserName,
} satisfies Meta<typeof MkUserName>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkUserName,
			},
			props: Object.keys(argTypes),
			template: '<MkUserName v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUserName>;
export default meta;
