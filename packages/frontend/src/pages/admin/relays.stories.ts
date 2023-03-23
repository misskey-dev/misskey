/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import relays_ from './relays.vue';
const meta = {
	title: 'pages/admin/relays',
	component: relays_,
} satisfies Meta<typeof relays_>;
export const Default = {
	render(args) {
		return {
			components: {
				relays_,
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
			template: '<relays_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof relays_>;
export default meta;
