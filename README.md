# Cloudscript VS Code Extension

Cloudscript is a new Infrastructure-as-Code (IaC) language inspired by HCL. This Visual Studio Code extension provides syntax highlighting, language configuration, and helpful snippets for `.cloud` files. The language also supports custom type definitions to help modularize code and validate resources against typed schemas.

## Features

- **Syntax Highlighting**: Highlights keywords such as `providers`, `service`, `infrastructure`, `configuration`, `containers`, and `deployment`.
- **Comments and Bracket Support**: Supports single-line (`#`). Includes basic bracket pairing and indentation rules.
- **Snippets**: Provides a default template snippet for new `.cloud` files. When you open or create a `.cloud` file, you can quickly insert a scaffold with `providers {}`, and a base service block.
- **Custom Types Integration** (Planned / In Progress): Prepare for more advanced features like validation of resources against custom types. For example:

```hcl
type DatabaseConfig {
    engine: "postgres" | "mysql" | "sqlite"
    version: string?
    storage: number = 20
}

resource "aws_db_instance" "default" {
    type    = DatabaseConfig
    engine  = "postgres"
    version = "12.3"
}
```

Once integrated with a language server, this would ensure missing fields are caught and defaults are applied.

## Requirements

- Visual Studio Code (latest version recommended)
- Node.js and npm (if you plan on developing and testing the extension)
- Basic familiarity with IaC files and HashiCorp Configuration Language (HCL) syntax

## Installation

### From the VSIX File (Local):
1. Run `npm install` and `npm run compile` if you have a build step.
2. Press `F5` in VS Code to launch the extension in a new Extension Development Host window.
3. Once tested, you can package it using `vsce package` (if you have vsce installed), then install the .vsix via:
   - View > Extensions in VS Code
   - Click on the `...` menu and select "Install from VSIX..."
   - Select the generated .vsix file to install.

### From Marketplace (if published):
1. Open the Extensions view in VS Code (`Ctrl+Shift+X` or `Cmd+Shift+X` on macOS).
2. Search for "Cloudscript" and click Install.

## Using the Extension

### Opening .cloud Files:
When you open a file ending in `.cloud`, the extension will automatically apply Cloudscript syntax highlighting.

### Inserting the Default Template:
Create a new `.cloud` file, then type `cloud-template` and select the snippet from the suggestion list to insert a basic scaffold:

```hcl
type CustomType {}

providers {}

service "name" {
  provider = ""

  infrastructure {}

  configuration {}

  containers {}

  deployment {}
}
```

If you've enabled the snippet insertion via the `extension.js` logic, simply creating a new `.cloud` file may automatically insert this template if the file is empty.
