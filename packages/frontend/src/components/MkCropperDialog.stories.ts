/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkCropperDialog from './MkCropperDialog.vue';
const meta = {
	title: 'components/MkCropperDialog',
	component: MkCropperDialog,
} satisfies Meta<typeof MkCropperDialog>;
export const Default = {
	render(args) {
		return {
			components: {
				MkCropperDialog,
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
			template: '<MkCropperDialog v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkCropperDialog>;
export default meta;
