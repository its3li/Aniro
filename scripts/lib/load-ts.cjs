const fs = require('fs');
const ts = require('typescript');

if (!require.extensions['.ts']?.__aniroRegistered) {
  const loader = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
      },
      fileName: filename,
    });

    module._compile(output.outputText, filename);
  };

  loader.__aniroRegistered = true;
  require.extensions['.ts'] = loader;
}
