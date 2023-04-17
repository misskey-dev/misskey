/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import { onBeforeUnmount } from 'vue';
import MkSignupServerRules from './MkSignupServerRules.vue';
import { instance } from '@/instance';
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
	decorators: [
		(_, context) => ({
			setup() {
				instance.serverRules = context.args.serverRules;
				onBeforeUnmount(() => {
					// FIXME: 呼び出されない
					instance.serverRules = [];
				});
			},
			template: '<story/>',
		}),
	],
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkSignupServerRules>;
