// Debug do tsc - copia para H:\My Drive\minmax code\Websiteminimax\backend\
const ts = require('typescript');
const path = require('path');
const projectDir = __dirname;
const configFile = ts.readConfigFile(path.join(projectDir, 'tsconfig.simple.json'), ts.sys.readFile);
console.log('Config file errors:', configFile.error);
const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, projectDir);
console.log('Errors:', parsed.errors.slice(0, 3));
console.log('File names:', parsed.fileNames.slice(0, 10));
console.log('outDir:', parsed.options.outDir);
console.log('rootDir:', parsed.options.rootDir);

const program = ts.createProgram(parsed.fileNames, parsed.options);
const diagnostics = ts.getPreEmitDiagnostics(program);
console.log('Diagnostics count:', diagnostics.length);
diagnostics.slice(0, 5).forEach(d => {
  const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  if (d.file) {
    const pos = d.file.getLineAndCharacterOfPosition(d.start || 0);
    console.log(`  ${d.file.fileName}:${pos.line+1}:${pos.character+1} - ${msg}`);
  } else {
    console.log(`  ${msg}`);
  }
});

const result = program.emit();
console.log('Emit diagnostics count:', result.diagnostics.length);
result.diagnostics.slice(0, 5).forEach(d => {
  const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  console.log(`  ${msg}`);
});
console.log('Emit skipped:', result.emitSkipped);
