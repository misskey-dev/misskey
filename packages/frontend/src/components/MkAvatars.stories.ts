import { Meta, StoryObj } from '@storybook/vue3';
import MkAvatars from './MkAvatars.vue';
const meta = {
	title: 'components/MkAvatars',
	component: MkAvatars,
} satisfies Meta<typeof MkAvatars>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkAvatars,
			},
			props: Object.keys(argTypes),
			template: '<MkAvatars v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkAvatars>;
export default meta;
