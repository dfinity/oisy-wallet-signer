use crate::state::STATE;
use crate::wallet_types::OwnerId;
use candid::Principal;
use ic_cdk::caller;

pub fn caller_is_owner() -> Result<(), String> {
    let caller = caller();
    let owners: Vec<OwnerId> = STATE.with(|state| state.borrow().heap.owners.clone());

    if is_owner(caller, &owners) {
        Ok(())
    } else {
        Err("Caller is not an owner.".to_string())
    }
}

fn is_owner(caller: Principal, owners: &[OwnerId]) -> bool {
    owners.iter().any(|&owner_id| owner_id == caller)
}
