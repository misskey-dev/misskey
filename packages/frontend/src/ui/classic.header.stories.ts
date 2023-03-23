/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import classic_header from './classic.header.vue';
const meta = {
	title: 'ui/classic.header',
	component: classic_header,
} satisfies Meta<typeof classic_header>;
export const Default = {
	render(args) {
		return {
			components: {
				classic_header,
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
			template: '<classic_header v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof classic_header>;
export default meta;
