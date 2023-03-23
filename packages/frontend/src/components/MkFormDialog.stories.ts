/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkFormDialog from './MkFormDialog.vue';
const meta = {
	title: 'components/MkFormDialog',
	component: MkFormDialog,
} satisfies Meta<typeof MkFormDialog>;
export const Default = {
	render(args) {
		return {
			components: {
				MkFormDialog,
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
			template: '<MkFormDialog v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkFormDialog>;
export default meta;
