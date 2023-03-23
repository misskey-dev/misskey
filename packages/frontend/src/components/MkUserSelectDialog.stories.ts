/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkUserSelectDialog from './MkUserSelectDialog.vue';
const meta = {
	title: 'components/MkUserSelectDialog',
	component: MkUserSelectDialog,
} satisfies Meta<typeof MkUserSelectDialog>;
export const Default = {
	render(args) {
		return {
			components: {
				MkUserSelectDialog,
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
			template: '<MkUserSelectDialog v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUserSelectDialog>;
export default meta;
