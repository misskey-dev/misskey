/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkDriveSelectDialog from './MkDriveSelectDialog.vue';
const meta = {
	title: 'components/MkDriveSelectDialog',
	component: MkDriveSelectDialog,
} satisfies Meta<typeof MkDriveSelectDialog>;
export const Default = {
	render(args) {
		return {
			components: {
				MkDriveSelectDialog,
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
			template: '<MkDriveSelectDialog v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkDriveSelectDialog>;
export default meta;
