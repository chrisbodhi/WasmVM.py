import { useEffect, useState } from "react";

import {
  Command,
  commands,
  Instruction,
  valueCommands,
  WasmVMClient,
} from "./wasmvmclient";

import "./App.css";

const InstructionButton = ({
  instruction,
  acceptsValue,
  onClick,
}: {
  instruction: Command;
  acceptsValue: boolean;
  onClick: (instruction: Command, value?: number) => void;
}) => {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onClick(instruction, value ? Number(value) : undefined);
        setValue("");
      }}
      style={{
        backgroundColor: acceptsValue ? "lightgreen" : "lightcoral",
      }}
    >
      <strong>{instruction}</strong>
      <span> i32</span>
      {acceptsValue ? (
        <>
          <input
            type="range"
            onChange={(e) => setValue(e.target.value)}
            value={value}
            min={-100}
            max={100}
          />
          <span>{value || 0}</span>
        </>
      ) : null}
      <button type="submit">Queue</button>
    </form>
  );
};

function App() {
  const [client, setClient] = useState<WasmVMClient>();
  const [ready, setReady] = useState(false);
  const [toSend, setToSend] = useState<Instruction[]>([]);
  const [stack, setStack] = useState<string[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const c = new WasmVMClient();
    c.initialize()
      .then(() => c.createVM())
      .then(() => {
        setClient(c);
        setReady(true);
      })
      .catch((e: unknown) => {
        console.error(e);
        setError(e instanceof Error ? e.message : String(e));
      });
  }, []);

  const resetVM = async () => {
    if (!client) return;
    await client.createVM();
    setStack([]);
    setToSend([]);
    setError(undefined);
  };

  const addInstruction = (instruction: Command, value?: number) => {
    setToSend([...toSend, { instruction, value }]);
  };

  const handleRemove = (index: number) =>
    setToSend(toSend.filter((_, i) => i !== index));

  const sendInstructions = async () => {
    if (!client) return;
    try {
      const nextStack = await client.executeInstructions(toSend);
      setToSend([]);
      setStack(nextStack);
      setError(undefined);
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <>
      <header>
        <h1>WasmVM (Rust)</h1>
        <p>
          Phase 1 &middot; i32 stack machine &middot;{" "}
          {ready ? "wasm ready" : "loading wasm…"}
        </p>
      </header>
      <main>
        {error ? (
          <div style={{ color: "crimson" }}>Error: {error}</div>
        ) : null}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div className="card">
            <h2>Instructions</h2>
            <ul>
              {commands.map((instruction) => (
                <li
                  key={instruction}
                  style={{ listStyle: "none", margin: "0.5rem" }}
                >
                  <InstructionButton
                    instruction={instruction}
                    acceptsValue={valueCommands.has(instruction)}
                    onClick={addInstruction}
                  />
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h2>Program</h2>
            <ul style={{ display: "flex", flexDirection: "column-reverse" }}>
              {toSend.map(({ instruction, value }, index) => (
                <li key={index}>
                  <div className="rounded">
                    <span>{instruction}</span>
                    {value !== undefined ? <span> {value}</span> : null}
                    <button onClick={() => handleRemove(index)}>×</button>
                  </div>
                </li>
              ))}
            </ul>
            <button
              onClick={sendInstructions}
              disabled={!ready || !toSend.length}
            >
              Run
            </button>
            <button onClick={resetVM} disabled={!ready}>
              Reset VM
            </button>
          </div>
          <div className="card">
            <h2>Stack</h2>
            <ul style={{ display: "flex", flexDirection: "column-reverse" }}>
              {stack.map((value, index) => (
                <li key={index + value}>{value}</li>
              ))}
            </ul>
          </div>
        </div>
      </main>
      <footer>
        <p>
          built in pgh &int; &copy; 2024 by{" "}
          <a href="https://github.com/chrisbodhi" target="_blank">
            @chrisbodhi
          </a>{" "}
          &int;{" "}
          <a href="https://github.com/chrisbodhi/WasmVM.py" target="_blank">
            pull requests welcome
          </a>
        </p>
      </footer>
    </>
  );
}

export default App;
