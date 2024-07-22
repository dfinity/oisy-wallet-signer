use ic_cdk::{export_candid, query};

#[query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

export_candid!();
