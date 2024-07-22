use crate::wallet_types::State;
use std::cell::RefCell;

thread_local! {
    pub static STATE: RefCell<State> = RefCell::default();
}
