/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import MkUserSetupDialog from './MkUserSetupDialog.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkUserSetupDialog,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...this.args,
					};
				},
			},
			template: '<MkUserSetupDialog v-bind="props" />',
		};
	},
	args: {
		
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUserSetupDialog>;
