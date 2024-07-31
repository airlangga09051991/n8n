import type {
	IDataObject,
	IExecuteFunctions,
	IExecuteSingleFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	INodeListSearchResult,
	INodePropertyOptions,
} from 'n8n-workflow';

export async function oktaApiRequest(
	this: IExecuteFunctions | IExecuteSingleFunctions | IHookFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	resource: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	url?: string,
	option: IDataObject = {},
) {
	const credentials = await this.getCredentials('oktaApi');
	let options: IHttpRequestOptions = {
		headers: {
			'Content-Type': 'application/json',
		},
		method,
		body,
		qs,
		url: url || `${credentials.url}/api/v1/${resource}`,
		json: true,
	};
	if (!Object.keys(body).length) {
		delete options.body;
	}
	if (!Object.keys(qs).length) {
		delete options.qs;
	}
	options = Object.assign({}, options, option);
	return await this.helpers.httpRequestWithAuthentication.call(this, 'oktaApi', options);
}

export async function getUsers(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const responseData = await oktaApiRequest.call(this, 'GET', '/users/', undefined, {});
	let users: INodePropertyOptions[];
	if (filter) {
		users = responseData
			.filter((user: { profile: { firstName: string; lastName: string }; id: string }) => {
				if (!filter) return true;
				const fullName = `${user.profile.firstName} ${user.profile.lastName}`.toLowerCase();
				return fullName.includes(filter.toLowerCase());
			})
			.map((user: { profile: { firstName: string; lastName: string }; id: string }) => {
				const name = user.profile.firstName + ' ' + user.profile.lastName;
				const value = user.id;
				return { name, value };
			});
	} else {
		users = responseData.map(
			(user: { profile: { firstName: string; lastName: string }; id: string }) => {
				const name = user.profile.firstName + ' ' + user.profile.lastName;
				const value = user.id;
				return { name, value };
			},
		);
	}
	return {
		results: users,
	};
}
