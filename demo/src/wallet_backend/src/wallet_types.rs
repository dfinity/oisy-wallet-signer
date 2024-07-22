use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

pub type OwnerId = Principal;

#[derive(CandidType, Deserialize)]
pub struct WalletArgs {
    pub owners: Vec<OwnerId>,
}

#[derive(Default, CandidType, Serialize, Deserialize, Clone)]
pub struct HeapState {
    pub owners: Vec<OwnerId>,
}

#[derive(Default, Serialize, Deserialize)]
pub struct State {
    pub heap: HeapState,
}
