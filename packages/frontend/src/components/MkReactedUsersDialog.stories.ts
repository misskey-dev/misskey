import { Meta, Story } from '@storybook/vue3';
import MkReactedUsersDialog from './MkReactedUsersDialog.vue';
const meta = {
	title: 'components/MkReactedUsersDialog',
	component: MkReactedUsersDialog,
};
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
};
export default meta;
