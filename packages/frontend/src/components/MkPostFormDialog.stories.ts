/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkPostFormDialog from './MkPostFormDialog.vue';
const meta = {
	title: 'components/MkPostFormDialog',
	component: MkPostFormDialog,
} satisfies Meta<typeof MkPostFormDialog>;
export const Default = {
	render(args) {
		return {
			components: {
				MkPostFormDialog,
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
			template: '<MkPostFormDialog v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkPostFormDialog>;
export default meta;
