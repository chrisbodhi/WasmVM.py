{
  pkgs ? import <nixpkgs> {},
}:

pkgs.mkShell {
  buildInputs = [
    pkgs.bun
  ];

  shellHook = ''
    echo "Bun version: $(bun --version)"
    # Create a virtual environment if it doesn't exist
    # python3 -m venv .venv

    # Activate the virtual environment
    source .venv/bin/activate

    # Install Python dependencies
    # pip install -r requirements.txt

    # Optionally, install Pyodide in the virtual environment (if needed)
    # python3 -m pip install pyodide

    echo "Virtual environment set up and activated."
    zsh
  '';
}
