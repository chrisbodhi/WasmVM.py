use crate::instruction::Instruction;
use crate::value::Value;

#[derive(Debug)]
pub enum VmError {
    StackUnderflow,
    DivisionByZero,
}

impl core::fmt::Display for VmError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            VmError::StackUnderflow => write!(f, "stack underflow"),
            VmError::DivisionByZero => write!(f, "division by zero"),
        }
    }
}

#[derive(Default, Debug)]
pub struct VmState {
    pub stack: Vec<Value>,
    pub pc: usize,
}

#[derive(Default, Debug)]
pub struct StackVm {
    pub state: VmState,
    pub program: Vec<Instruction>,
}

impl StackVm {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn queue(&mut self, instruction: Instruction) {
        self.program.push(instruction);
    }

    pub fn run(&mut self) -> Result<(), VmError> {
        while self.state.pc < self.program.len() {
            let instr = self.program[self.state.pc];
            step(&mut self.state, instr)?;
            self.state.pc += 1;
        }
        self.state.pc = 0;
        self.program.clear();
        Ok(())
    }

    pub fn reset(&mut self) {
        self.state = VmState::default();
        self.program.clear();
    }
}

fn pop_i32(state: &mut VmState) -> Result<i32, VmError> {
    state
        .stack
        .pop()
        .map(Value::as_i32)
        .ok_or(VmError::StackUnderflow)
}

fn step(state: &mut VmState, instruction: Instruction) -> Result<(), VmError> {
    match instruction {
        Instruction::Push(v) => state.stack.push(v),
        Instruction::Pop | Instruction::Drop => {
            pop_i32(state)?;
        }
        Instruction::Add => {
            let b = pop_i32(state)?;
            let a = pop_i32(state)?;
            state.stack.push(Value::I32(a.wrapping_add(b)));
        }
        Instruction::Sub => {
            let b = pop_i32(state)?;
            let a = pop_i32(state)?;
            state.stack.push(Value::I32(a.wrapping_sub(b)));
        }
        Instruction::Mul => {
            let b = pop_i32(state)?;
            let a = pop_i32(state)?;
            state.stack.push(Value::I32(a.wrapping_mul(b)));
        }
        Instruction::Div => {
            let b = pop_i32(state)?;
            let a = pop_i32(state)?;
            if b == 0 {
                return Err(VmError::DivisionByZero);
            }
            state.stack.push(Value::I32(a.wrapping_div(b)));
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn push_and_add() {
        let mut vm = StackVm::new();
        vm.queue(Instruction::Push(Value::I32(3)));
        vm.queue(Instruction::Push(Value::I32(4)));
        vm.queue(Instruction::Add);
        vm.run().unwrap();
        assert_eq!(vm.state.stack, vec![Value::I32(7)]);
    }

    #[test]
    fn sub_is_ordered() {
        let mut vm = StackVm::new();
        vm.queue(Instruction::Push(Value::I32(10)));
        vm.queue(Instruction::Push(Value::I32(3)));
        vm.queue(Instruction::Sub);
        vm.run().unwrap();
        assert_eq!(vm.state.stack, vec![Value::I32(7)]);
    }

    #[test]
    fn div_by_zero_errors() {
        let mut vm = StackVm::new();
        vm.queue(Instruction::Push(Value::I32(1)));
        vm.queue(Instruction::Push(Value::I32(0)));
        vm.queue(Instruction::Div);
        assert!(matches!(vm.run(), Err(VmError::DivisionByZero)));
    }

    #[test]
    fn underflow_errors() {
        let mut vm = StackVm::new();
        vm.queue(Instruction::Add);
        assert!(matches!(vm.run(), Err(VmError::StackUnderflow)));
    }

    #[test]
    fn drop_removes_top() {
        let mut vm = StackVm::new();
        vm.queue(Instruction::Push(Value::I32(1)));
        vm.queue(Instruction::Push(Value::I32(2)));
        vm.queue(Instruction::Drop);
        vm.run().unwrap();
        assert_eq!(vm.state.stack, vec![Value::I32(1)]);
    }
}
