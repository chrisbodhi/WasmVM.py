use core::fmt;

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Value {
    I32(i32),
}

impl Value {
    pub fn as_i32(self) -> i32 {
        match self {
            Value::I32(v) => v,
        }
    }
}

impl fmt::Display for Value {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Value::I32(v) => write!(f, "{}:i32", v),
        }
    }
}
