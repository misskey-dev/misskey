import { Meta, StoryObj } from '@storybook/vue3';
import MkCaptcha from './MkCaptcha.vue';
const meta = {
	title: 'components/MkCaptcha',
	component: MkCaptcha,
} satisfies Meta<typeof MkCaptcha>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkCaptcha,
			},
			props: Object.keys(argTypes),
			template: '<MkCaptcha v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkCaptcha>;
export default meta;
