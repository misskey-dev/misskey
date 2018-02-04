/**
 * API Request
 */

declare const _API_URL_: string;

let spinner = null;
let pending = 0;

/**
 * Send a request to API
 * @param  {string|Object} i  Credential
 * @param  {string} endpoint  Endpoint
 * @param  {any} [data={}] Data
 * @return {Promise<any>} Response
 */
export default (i, endpoint, data = {}): Promise<{ [x: string]: any }> => {
	if (++pending === 1) {
		spinner = document.createElement('div');
		spinner.setAttribute('id', 'wait');
		document.body.appendChild(spinner);
	}

	// Append the credential
	if (i != null) (data as any).i = typeof i === 'object' ? i.token : i;

	return new Promise((resolve, reject) => {
		// Send request
		fetch(endpoint.indexOf('://') > -1 ? endpoint : `${_API_URL_}/${endpoint}`, {
			method: 'POST',
			body: JSON.stringify(data),
			credentials: endpoint === 'signin' ? 'include' : 'omit',
			cache: 'no-cache'
		}).then(res => {
			if (--pending === 0) spinner.parentNode.removeChild(spinner);
			if (res.status === 200) {
				res.json().then(resolve);
			} else if (res.status === 204) {
				resolve();
			} else {
				res.json().then(err => {
					reject(err.error);
				}, reject);
			}
		}).catch(reject);
	});
};
