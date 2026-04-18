//! wasmvm-core — educational stack VM, Phase 1.
//!
//! Scope: i32 values, instructions Push, Pop, Drop, Add, Sub, Mul, Div.
//! More types and instructions in Phase 2; memory in Phase 3.

mod instruction;
mod value;
mod vm;

use wasm_bindgen::prelude::*;

use instruction::Instruction;
use value::Value;
use vm::StackVm;

#[wasm_bindgen]
pub struct StackVM {
    inner: StackVm,
}

#[wasm_bindgen]
impl StackVM {
    #[wasm_bindgen(constructor)]
    pub fn new() -> StackVM {
        StackVM {
            inner: StackVm::new(),
        }
    }

    #[wasm_bindgen(js_name = queuePushI32)]
    pub fn queue_push_i32(&mut self, value: i32) {
        self.inner.queue(Instruction::Push(Value::I32(value)));
    }

    /// Queue a value-less instruction by name: "pop" | "drop" | "add" | "sub" | "mul" | "div".
    pub fn queue(&mut self, op: &str) -> Result<(), JsValue> {
        let instr = match op {
            "pop" => Instruction::Pop,
            "drop" => Instruction::Drop,
            "add" => Instruction::Add,
            "sub" => Instruction::Sub,
            "mul" => Instruction::Mul,
            "div" => Instruction::Div,
            other => {
                return Err(JsValue::from_str(&format!(
                    "unknown instruction: {other}"
                )))
            }
        };
        self.inner.queue(instr);
        Ok(())
    }

    pub fn run(&mut self) -> Result<(), JsValue> {
        self.inner
            .run()
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    pub fn inspect(&self) -> Vec<JsValue> {
        self.inner
            .state
            .stack
            .iter()
            .map(|v| JsValue::from_str(&v.to_string()))
            .collect()
    }

    pub fn reset(&mut self) {
        self.inner.reset();
    }
}

impl Default for StackVM {
    fn default() -> Self {
        Self::new()
    }
}
