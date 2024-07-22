use crate::guards::caller_is_owner;
use crate::state::STATE;
use crate::wallet_types::{HeapState, State, WalletArgs};
use ic_cdk::api::call::{arg_data, ArgDecoderConfig};
use ic_cdk::storage::{stable_restore, stable_save};
use ic_cdk::{export_candid, init, post_upgrade, pre_upgrade, query};

mod guards;
mod state;
mod wallet_types;

#[init]
pub fn init() {
    let call_arg = arg_data::<(Option<WalletArgs>,)>(ArgDecoderConfig::default()).0;
    let WalletArgs { owners } = call_arg.unwrap();

    let heap = HeapState { owners };

    STATE.with(|state| {
        *state.borrow_mut() = State { heap };
    });
}

#[pre_upgrade]
fn pre_upgrade() {
    STATE.with(|state| stable_save((&state.borrow().heap,)).unwrap());
}

#[post_upgrade]
fn post_upgrade() {
    let (upgrade_stable,): (HeapState,) = stable_restore().unwrap();

    STATE.with(|state| {
        *state.borrow_mut() = State {
            heap: upgrade_stable,
        }
    });
}

#[query(guard = "caller_is_owner")]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

export_candid!();
