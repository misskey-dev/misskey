/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import XFollow from './MkUserSetupDialog.Follow.vue';
export const Default = {
	render(args) {
		return {
			components: {
				XFollow,
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
			template: '<XFollow v-bind="props" />',
		};
	},
	args: {
		
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof XFollow>;
