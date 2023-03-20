import { Meta, StoryObj } from '@storybook/vue3';
import MkReactedUsersDialog from './MkReactedUsersDialog.vue';
const meta = {
	title: 'components/MkReactedUsersDialog',
	component: MkReactedUsersDialog,
} satisfies Meta<typeof MkReactedUsersDialog>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkReactedUsersDialog,
			},
			props: Object.keys(argTypes),
			template: '<MkReactedUsersDialog v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkReactedUsersDialog>;
export default meta;
