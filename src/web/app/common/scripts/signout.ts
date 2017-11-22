declare const _HOST_: string;

export default () => {
	localStorage.removeItem('me');
	document.cookie = `i=; domain=.${_HOST_}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
	location.href = '/';
};
