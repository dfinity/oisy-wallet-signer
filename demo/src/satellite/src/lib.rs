use junobuild_satellite::{
    include_satellite
};
use ic_cdk_macros::update;
use icrc_ledger_types::icrc::generic_metadata_value::MetadataValue;

#[update]
fn icrc1_metadata() -> Vec<(String, MetadataValue)> {
    let vec: Vec<(String, MetadataValue)> = vec![
        ("icrc1:name".to_string(), MetadataValue::Text("Token".to_string())),
        ("icrc1:decimals".to_string(), MetadataValue::from(8_u64)),
        ("icrc1:symbol".to_string(), MetadataValue::Text("TKN".to_string())),
        ("icrc1:fee".to_string(), MetadataValue::from(10_000_u64)),
    ];

    vec
}

include_satellite!();
