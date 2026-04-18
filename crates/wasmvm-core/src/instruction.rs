use crate::value::Value;

#[derive(Clone, Copy, Debug)]
pub enum Instruction {
    Push(Value),
    Pop,
    Drop,
    Add,
    Sub,
    Mul,
    Div,
}
