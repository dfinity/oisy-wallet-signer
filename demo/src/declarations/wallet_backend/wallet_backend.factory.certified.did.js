// @ts-ignore
export const idlFactory = ({ IDL }) => {
	return IDL.Service({ greet: IDL.Func([IDL.Text], [IDL.Text], []) });
};
// @ts-ignore
export const init = ({ IDL }) => {
	return [];
};
