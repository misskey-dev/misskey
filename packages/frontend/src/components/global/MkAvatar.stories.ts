import { Meta, StoryObj } from '@storybook/vue3';
import MkAvatar from './MkAvatar.vue';
const meta = {
	title: 'components/global/MkAvatar',
	component: MkAvatar,
} satisfies Meta<typeof MkAvatar>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkAvatar,
			},
			props: Object.keys(argTypes),
			template: '<MkAvatar v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkAvatar>;
export default meta;
