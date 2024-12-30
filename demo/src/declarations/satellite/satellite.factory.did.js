// This file was automatically generated by the Juno CLI.
// Any modifications may be overwritten.

export const idlFactory = ({ IDL }) => {
	const MetadataValue = IDL.Variant({
		Int: IDL.Int,
		Nat: IDL.Nat,
		Blob: IDL.Vec(IDL.Nat8),
		Text: IDL.Text
	});
	return IDL.Service({
		build_version: IDL.Func([], [IDL.Text], ['query']),
		icrc1_metadata: IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Text, MetadataValue))], [])
	});
};
export const init = ({ IDL }) => {
	return [];
};