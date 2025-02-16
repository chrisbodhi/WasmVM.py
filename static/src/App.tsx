import { useEffect, useState } from "react";

import { commands, Instruction, NumTypes, WasmVMClient } from "./wasmvmclient";

import "./App.css";

// const WHEEL_URL =
// "https://files.pythonhosted.org/packages/91/b2/d798c9f63876e2551b62afdd5cb39b9ddfe15b16ab29c3b3503a206e628e/WasmVM-0.1.0-py3-none-any.whl";
const WHEEL_URL = "http://localhost:8080/dist/WasmVM-0.1.0-py3-none-any.whl";

const createWasmVMClient = async (wheelUrl: string) =>
  new WasmVMClient(wheelUrl);

const InstructionButton = ({
  instruction,
  type,
  acceptsValue,
  onClick,
}: Pick<Instruction, "instruction" | "type"> & {
  acceptsValue: boolean;
  onClick: (
    instruction: (typeof commands)[number],
    type: NumTypes,
    value?: number,
  ) => void;
}) => {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onClick(instruction, type, value ? Number(value) : undefined);
        // Reset the state
        setValue("");
      }}
      style={{
        backgroundColor: acceptsValue ? "lightgreen" : "lightcoral",
      }}
    >
      {instruction}
      <select value={type}>{type}</select>
      {acceptsValue ? (
        <>
          <input
            type="range"
            onChange={(e) => setValue(e.target.value)}
            value={value}
            min={-100}
          />
          {value}
        </>
      ) : null}
      <button>Move to stack</button>
    </form>
  );
};

function App() {
  const [client, setClient] = useState<WasmVMClient>();
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [toSend, setToSend] = useState<
    {
      instruction: (typeof commands)[number];
      type: NumTypes;
      value?: number;
    }[]
  >([]);
  const [maxPages, setMaxPages] = useState(1);
  const [pages, setPages] = useState(0);
  const [stack, setStack] = useState<string[]>([]);

  useEffect(() => {
    async function makeClient() {
      const client = await createWasmVMClient(WHEEL_URL);
      client.initialize(import.meta.env.DEV);
      setClient(client);
    }
    makeClient();
  }, []);

  async function getVM() {
    try {
      await client?.createVM({ pages, maxPages });
    } catch (error) {
      alert("Failed to create VM. See console.");
      if (error instanceof Error) {
        console.error("Detailed error:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      } else {
        console.error("Error:", error);
      }
    }
  }

  const fetchInstructions = async () => {
    const rawInstructions: Instruction[] = commands.map((cmd) => ({
      instruction: cmd,
      type: cmd === "eqz" ? ["i32", "i64"] : ["i32", "i64", "f32", "f64"],
    }));
    setInstructions(rawInstructions);
  };

  const addInstruction = (
    instruction: (typeof commands)[number],
    type: NumTypes,
    value: number | undefined,
  ) => {
    setToSend([...toSend, { instruction, type, value }]);
  };

  const handleValueChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const value = Number(e.target.value);
    const newSend = toSend.map((s, i) => (i === index ? { ...s, value } : s));
    setToSend(newSend);
  };

  const handleRemove = (index: number) =>
    setToSend(toSend.filter((_, i) => i !== index));

  const sendInstructions = async () => {
    if (!client) {
      alert("No VM; get one");
      return;
    }

    console.log("About to start.", toSend);

    await client.executeInstructions(toSend);

    setToSend([]);
    setStack(client.inspectStack());
  };

  return (
    <>
      <header>
        <h1>WasmVM.py</h1>
      </header>
      <main>
        <div>
          {instructions.length === 0 && (
            <button onClick={fetchInstructions}>Get instructions</button>
          )}
          <div>
            VM contents:{" "}
            {/* {client ? JSON.stringify(client.inspectStack()) : "Get a new VM"} */}
          </div>
          <div>
            {/* TODO: this isn't it, is it? */}
            VM instructions:{" "}
            {/* {client ? JSON.stringify(client.inspectStack()) : "None"} */}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <label>
              Pages
              <input
                type="number"
                onChange={(event) => setPages(Number(event.target.value))}
              />
            </label>
            <label>
              Max pages
              <input
                type="number"
                onChange={(event) => setMaxPages(Number(event.target.value))}
              />
            </label>
            <button onClick={() => getVM()}>Get a new VM</button>
          </form>
        </div>
        <div style={{ display: "flex" }}>
          <div className="card">
            <ul>
              {instructions.map(
                ({ instruction, type, acceptsValue }, index) => (
                  <li
                    key={index + instruction}
                    style={{ listStyle: "none", margin: "0.5rem" }}
                  >
                    <InstructionButton
                      acceptsValue={acceptsValue}
                      instruction={instruction}
                      type={type}
                      onClick={addInstruction}
                    />
                  </li>
                ),
              )}
            </ul>
          </div>
          <div className="card">
            <h2>Instructions to send</h2>
            <ul style={{ display: "flex", flexDirection: "column-reverse" }}>
              {toSend.map(({ instruction, value }, index) => (
                <li key={index + instruction}>
                  <div className="rounded">
                    <span>{instruction}</span>
                    {value !== undefined ? <span>{value}</span> : null}
                    <button onClick={() => handleRemove(index)}>×</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <button onClick={sendInstructions} disabled={!toSend.length}>
              <big>Send instructions</big>
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
          {" "}
          built in pgh &int; &copy; 2024 by{" "}
          <a href="https://github.com/chrisbodhi" target="_blank">
            @chrisbodhi
          </a>{" "}
          &int;{" "}
          <a href="https://github.com/chrisbodhi/WasmVM.py" target="_blank">
            pull requests welcome
          </a>{" "}
        </p>
      </footer>
    </>
  );
}

export default App;
