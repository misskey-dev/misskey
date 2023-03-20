export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkAnalogClock,
			},
			props: Object.keys(argTypes),
			template: '<MkAnalogClock v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
