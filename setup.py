from setuptools import find_packages, setup
import pathlib


here = pathlib.Path(__file__).parent.resolve()
long_description = (here / 'README.md').read_text(encoding='utf-8')

setup(
    name="WasmVM",
    version="0.1.0",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="chris boette",
    classifiers=[
        "Development Status :: 3 - Alpha",
    ],
    packages=find_packages(where="src", exclude=["static", "static.*"]),
    package_dir={"": "src"},
    python_requires=">=3.12, <4",
)
