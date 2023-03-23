/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import navbar_for_mobile from './navbar-for-mobile.vue';
const meta = {
	title: 'ui/_common_/navbar-for-mobile',
	component: navbar_for_mobile,
} satisfies Meta<typeof navbar_for_mobile>;
export const Default = {
	render(args) {
		return {
			components: {
				navbar_for_mobile,
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
			template: '<navbar_for_mobile v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof navbar_for_mobile>;
export default meta;
