import { Meta } from '@storybook/vue3';
const meta = {
	title: 'components/MkButton',
	component: MkButton,
} satisfies Meta<typeof MkButton>;
export default meta;
import { StoryObj } from '@storybook/vue3';
import MkButton from './MkButton.vue';
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkButton,
			},
			props: Object.keys(argTypes),
			template: '<MkButton v-bind="$props">Text</MkButton>',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkButton>;
