from wasmvm.lib import VMState

def print_state(state: VMState) -> None:
    print(f"Stack: {state.stack}, PC: {state.pc}")
