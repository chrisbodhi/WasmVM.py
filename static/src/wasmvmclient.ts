import init, { StackVM } from "./wasmvm-pkg/wasmvm_core.js";

export type Command = "push" | "pop" | "drop" | "add" | "sub" | "mul" | "div";

export const commands: Command[] = [
  "push",
  "pop",
  "drop",
  "add",
  "sub",
  "mul",
  "div",
];

export const valueCommands: ReadonlySet<Command> = new Set(["push"]);

export interface Instruction {
  instruction: Command;
  value?: number;
}

export class WasmVMClient {
  private vm: StackVM | null = null;
  private ready: Promise<void>;

  constructor() {
    this.ready = init().then(() => undefined);
  }

  async initialize(): Promise<void> {
    await this.ready;
  }

  async createVM(): Promise<void> {
    await this.ready;
    this.vm?.free();
    this.vm = new StackVM();
  }

  async executeInstructions(instructions: Instruction[]): Promise<string[]> {
    await this.ready;
    if (!this.vm) throw new Error("VM not initialized");

    for (const { instruction, value } of instructions) {
      if (instruction === "push") {
        if (value === undefined) {
          throw new Error("push requires a value");
        }
        this.vm.queuePushI32(value | 0);
      } else {
        this.vm.queue(instruction);
      }
    }
    this.vm.run();
    return this.inspectStack();
  }

  inspectStack(): string[] {
    if (!this.vm) throw new Error("VM not initialized");
    return this.vm.inspect().map((v) => String(v));
  }
}
