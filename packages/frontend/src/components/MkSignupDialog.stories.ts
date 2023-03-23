/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkSignupDialog from './MkSignupDialog.vue';
const meta = {
	title: 'components/MkSignupDialog',
	component: MkSignupDialog,
} satisfies Meta<typeof MkSignupDialog>;
export const Default = {
	render(args) {
		return {
			components: {
				MkSignupDialog,
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
			template: '<MkSignupDialog v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkSignupDialog>;
export default meta;
