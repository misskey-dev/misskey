import CONFIG from './config';

export default () => {
	localStorage.removeItem('me');
	document.cookie = `i=; domain=.${CONFIG.host}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
	location.href = '/';
};
