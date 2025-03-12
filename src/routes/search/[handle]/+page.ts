import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	return {
		handle: params.handle
	};
};
