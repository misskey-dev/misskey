/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkReactedUsersDialog from './MkReactedUsersDialog.vue';
const meta = {
	title: 'components/MkReactedUsersDialog',
	component: MkReactedUsersDialog,
} satisfies Meta<typeof MkReactedUsersDialog>;
export const Default = {
	render(args) {
		return {
			components: {
				MkReactedUsersDialog,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<MkReactedUsersDialog v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkReactedUsersDialog>;
export default meta;
