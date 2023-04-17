/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import MkSignupServerRules from './MkSignupServerRules.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkSignupServerRules,
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
			template: '<MkSignupServerRules v-bind="props" />',
		};
	},
	args: {
		serverRules: [
			'サーバールール 1',
			'サーバールール 2',
			'サーバールール 3',
		],
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkSignupServerRules>;
