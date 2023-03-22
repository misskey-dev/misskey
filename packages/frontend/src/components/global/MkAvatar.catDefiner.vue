<template>
<svg id="mk-avatar-cat-definer" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" :style="{ contain: 'strict' }">
	<defs>
		<mask id="mk-avatar-cat-left-mask" x="-20%" y="-20%" width="140%" height="140%">
			<circle cx="7" cy="7" r="5" fill="white"/>
			<rect x="0" y="2.1" width="14" height="11.9"/>
			<rect x="7" y="0" width="7" height="14"/>
			<circle cx="7" cy="7" r="4.9"/>
		</mask>
		<mask id="mk-avatar-cat-right-mask" x="-20%" y="-20%" width="140%" height="140%">
			<circle cx="7" cy="7" r="5" fill="white"/>
			<rect x="0" y="2.1" width="14" height="11.9"/>
			<rect x="0" y="0" width="7" height="14"/>
			<circle cx="7" cy="7" r="4.9"/>
		</mask>
		<filter id="mk-avatar-cat-left-filter" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
			<feOffset dx="2"/>
			<feMorphology operator="dilate" radius="7"/>
		</filter>
		<filter id="mk-avatar-cat-right-filter" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
			<feOffset dx="-2"/>
			<feMorphology operator="dilate" radius="7"/>
		</filter>
	</defs>
</svg>
</template>
