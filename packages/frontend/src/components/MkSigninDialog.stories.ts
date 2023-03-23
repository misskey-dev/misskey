/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkSigninDialog from './MkSigninDialog.vue';
const meta = {
	title: 'components/MkSigninDialog',
	component: MkSigninDialog,
} satisfies Meta<typeof MkSigninDialog>;
export const Default = {
	render(args) {
		return {
			components: {
				MkSigninDialog,
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
			template: '<MkSigninDialog v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkSigninDialog>;
export default meta;
