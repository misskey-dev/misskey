/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import XProfile from './MkUserSetupDialog.Profile.vue';
export const Default = {
	render(args) {
		return {
			components: {
				XProfile,
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
			template: '<XProfile v-bind="props" />',
		};
	},
	args: {
		
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof XProfile>;
