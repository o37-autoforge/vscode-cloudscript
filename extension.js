const vscode = require('vscode');
const path = require('path');

let resourceTemplates = {};

try {
    const resourcesPath = path.join(__dirname, 'resources.json');
    resourceTemplates = require(resourcesPath);
} catch (error) {
    console.error('Error loading resource templates:', error);
    vscode.window.showErrorMessage('Cloudscript Extension: Failed to load resource templates.');
}

function activate(context) {
    // File creation listener
    let disposable = vscode.workspace.onDidCreateFiles(async (event) => {
        for (const file of event.files) {
            if (file.fsPath.endsWith('.cloud')) {
                const document = await vscode.workspace.openTextDocument(file);
                const editor = await vscode.window.showTextDocument(document);
                if (document.getText().length === 0) {
                    const snippet = new vscode.SnippetString(`providers {}

service "\${1:name}" {
    provider = ""

    infrastructure {}

    configuration {}

    containers {}

    deployment {}
}`);
                    editor.insertSnippet(snippet, new vscode.Position(0, 0));
                }
            }
        }
    });

    context.subscriptions.push(disposable);

    // Register resource type completion provider
    const resourceTypeProvider = vscode.languages.registerCompletionItemProvider(
        'cloudscript',
        {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.trim().startsWith('resource_type')) {
                    return undefined;
                }

                // Create completion items for each resource type
                return Object.keys(resourceTemplates).map(resourceType => {
                    const completionItem = new vscode.CompletionItem(resourceType, vscode.CompletionItemKind.Value);
                    // Add spaces before and after the resource type
                    completionItem.insertText = ` "${resourceType}" `;
                    completionItem.command = {
                        command: 'editor.action.triggerSuggest',
                        title: 'Re-trigger completions...'
                    };
                    return completionItem;
                });
            }
        },
        '=' // Trigger on equals sign
    );

    // Register template completion provider
    const templateProvider = vscode.languages.registerCompletionItemProvider(
        'cloudscript',
        {
            provideCompletionItems(document, position) {
                const line = document.lineAt(position).text;
                const resourceTypeRegex = /resource_type\s*=\s*"([^"]+)"/;
                const match = resourceTypeRegex.exec(line);

                if (match) {
                    const resourceType = match[1];
                    const template = resourceTemplates[resourceType];

                    if (template) {
                        // Find the current block name
                        let blockName = "default";
                        const currentLine = position.line;
                        const blockNameRegex = /(?:compute|network|iam)\s*"([^"]+)"/;

                        for (let i = currentLine - 1; i >= 0; i--) {
                            const lineText = document.lineAt(i).text;
                            const nameMatch = blockNameRegex.exec(lineText);
                            if (nameMatch) {
                                blockName = nameMatch[1];
                                break;
                            }
                        }

                        const snippet = new vscode.SnippetString('\n');
                        let placeholderIndex = 1;

                        // Build the template
                        for (const [key, value] of Object.entries(template)) {
                            if (key === 'resource_type') continue;

                            if (Array.isArray(value)) {
                                snippet.appendText(`${key} = [`);
                                if (value.length > 0) {
                                    value.forEach((item, index) => {
                                        snippet.appendPlaceholder(`"${item}"`, placeholderIndex++);
                                        if (index < value.length - 1) {
                                            snippet.appendText(', ');
                                        }
                                    });
                                }
                                snippet.appendText(']\n');
                            } else if (typeof value === 'object' && value !== null) {
                                snippet.appendText(`${key} = {\n`);
                                for (const [subKey, subValue] of Object.entries(value)) {
                                    if (subKey.toLowerCase() === 'name' && key.toLowerCase() === 'tags') {
                                        snippet.appendText(`    ${subKey} = "${blockName}"\n`);
                                    } else {
                                        snippet.appendText(`    ${subKey} = `);
                                        snippet.appendPlaceholder(`"${subValue}"`, placeholderIndex++);
                                        snippet.appendText('\n');
                                    }
                                }
                                snippet.appendText('}\n');
                            } else {
                                snippet.appendText(`${key} = `);
                                snippet.appendPlaceholder(`"${value}"`, placeholderIndex++);
                                snippet.appendText('\n');
                            }
                        }

                        const completionItem = new vscode.CompletionItem('Insert Required Attributes', vscode.CompletionItemKind.Snippet);
                        completionItem.insertText = snippet;
                        completionItem.detail = `Insert required attributes for ${resourceType}`;
                        return [completionItem];
                    }
                }
                return undefined;
            }
        },
        ' ' // Trigger on space after resource_type = "aws_instance"
    );

    context.subscriptions.push(resourceTypeProvider, templateProvider);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};