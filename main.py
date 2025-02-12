from abc import ABCMeta
from typing import Literal
import uuid

from fastapi import FastAPI, status
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from wasmvm.virtual_machine import StackVM
from wasmvm.functions import num_fns
from wasmvm.lib import Add, AND, Div, Drop, Eq, Eqz, Ge, Gt, Instruction, Le, Lt, Mul, OR, Pop, Push, Sub, XOR
from wasmvm.shared import Wasm_Value

vms: dict[str, StackVM] = {}

app = FastAPI()

origins = [
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cmds: dict[str, ABCMeta] = {
    "add": Add,
    "and": AND,
    "div": Div,
    "drop": Drop,
    "eq": Eq,
    "eqz": Eqz,
    "ge": Ge,
    "gt": Gt,
    "le": Le,
    "lt": Lt,
    "mul": Mul,
    "or": OR,
    "pop": Pop,
    "push": Push,
    "sub": Sub,
    "xor": XOR,
}


class RPC(BaseModel):
    name: str
    type: Literal["i32", "i64", "f32", "f64"] | None = None
    value: Wasm_Value | None = None


class Dimensions(BaseModel):
    pages: int
    max_pages: int


def map_to_instruct(rpcs: list[RPC]) -> list[Instruction]:
    instructions: list[Instruction] = []
    for rpc in rpcs:
        name, type, value = rpc.name, rpc.type, rpc.value
        cmd = cmds[name]
        if type and value:
            type_fn = num_fns[type]
            instruct = cmd(type_fn(value))
        else:
            instruct = cmd(type)
        instructions.append(instruct)
    return instructions


@app.post("/create")
def get_or_create_vm(q: str | None = None, dimensions: Dimensions | None = None):
    """
    Get an existing stack virtual machine, or create a new one.
    """
    print(f"q: {q}")
    print(vms)
    if q and q in vms:
        return vms[q], q
    else:
        if dimensions:
            pages, max_pages = dimensions.pages, dimensions.max_pages
        else:
            pages, max_pages = 0, 1
        id = str(uuid.uuid4())
        vm = StackVM(pages, max_pages)
        vms[id] = vm
        return vm, id


@app.get("/instructions")
def get_instructions():
    """
    Return a list of available instructions to use with
    the stack virtual machine.
    """
    instructions = [{
        "instruction": instruction,
        "types": ["i32", "i64", "f32", "f64"]
            if instruction != "eqz" else ["i32", "i64"],
        "accepts_value": True if instruction == "push" else False
    } for instruction in cmds.keys() ]
    return { "instructions": instructions }


@app.post("/instructions/{vm_id}")
def add_instructions(vm_id: str, rpcs: list[RPC]):
    """
    Add one or more instructions to the specified stack virtual machine.
    """
    if not vm_id in vms:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"VM ${vm_id} not found")
    vm = vms[vm_id]
    instructions = map_to_instruct(rpcs)
    vm.instructions.extend(instructions)
    return vm.inspect()

@app.post("/run/{vm_id}")
def run(vm_id: str):
    """
    Execute the instructions for the specified stack virtual machine.
    """
    if not vm_id in vms:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"VM ${vm_id} not found")
    vm = vms[vm_id]
    vm.run()
    return vm.inspect()

@app.get("/inspect/{vm_id}")
def inspect(vm_id: str):
    """
    Inspect the specified stack virtual machine's current stack.
    """
    if not vm_id in vms:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"VM ${vm_id} not found")
    vm = vms[vm_id]
    return vm.inspect()
