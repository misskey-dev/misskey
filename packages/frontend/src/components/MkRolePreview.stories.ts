import { Meta, StoryObj } from '@storybook/vue3';
import MkRolePreview from './MkRolePreview.vue';
const meta = {
	title: 'components/MkRolePreview',
	component: MkRolePreview,
} satisfies Meta<typeof MkRolePreview>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkRolePreview,
			},
			props: Object.keys(argTypes),
			template: '<MkRolePreview v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkRolePreview>;
export default meta;
