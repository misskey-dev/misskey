/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { action } from '@storybook/addon-actions';
import { StoryObj } from '@storybook/vue3';
import cpu_mem from './cpu-mem.vue';
export const Default = {
	render(args) {
		return {
			components: {
				cpu_mem,
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
			template: '<cpu_mem v-bind="props" />',
		};
	},
	args: {
		stats: Array.from({ length: 50 }, (_, i) => ({
			cpu: (i % 11) / 10,
			mem: {
				active: (i % 11) / 10,
			},
		})),
		meta: {
			mem: {
				total: 1,
			},
		},
		connection: {
			on: action('on'),
			send: action('send'),
		},
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof cpu_mem>;
