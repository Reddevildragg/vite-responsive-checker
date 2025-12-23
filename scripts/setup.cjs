const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const pluginsDir = path.join(__dirname, '..', 'plugins');

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('Welcome to the Template Setup Script!');
  console.log('1. Setup for Project Development (Main App)');
  console.log('2. Setup for Plugin Development');

  const answer = await askQuestion('Select an option (1 or 2): ');

  if (answer.trim() === '1') {
    await setupProject();
  } else if (answer.trim() === '2') {
    await setupPlugin();
  } else {
    console.log('Invalid option.');
  }

  rl.close();
}

async function setupProject() {
  console.log('\nSetting up for Project Development...');

  // Here we could remove the example plugin if desired, or just leave it as reference.
  const removeExample = await askQuestion('Do you want to remove the example plugin? (y/n): ');

  if (removeExample.toLowerCase() === 'y') {
    const examplePluginPath = path.join(pluginsDir, 'example-plugin');
    if (fs.existsSync(examplePluginPath)) {
        fs.rmSync(examplePluginPath, { recursive: true, force: true });
        console.log('Example plugin removed.');

        // Also need to remove import from main.ts
        updateMainTs(false);
    }
  } else {
      console.log('Keeping example plugin.');
  }

  console.log('Project setup complete.');
}

async function setupPlugin() {
  console.log('\nSetting up for Plugin Development...');

  const pluginName = await askQuestion('Enter the name of your new plugin (kebab-case): ');

  if (!pluginName) {
    console.log('Plugin name is required.');
    return;
  }

  const newPluginDir = path.join(pluginsDir, pluginName);

  if (fs.existsSync(newPluginDir)) {
    console.log(`Plugin "${pluginName}" already exists.`);
    return;
  }

  fs.mkdirSync(newPluginDir, { recursive: true });

  // Create index.ts
  const indexContent = `import type { App } from 'vue';
import ${toPascalCase(pluginName)}Component from './${toPascalCase(pluginName)}Component.vue';

export default {
  install(app: App) {
    app.component('${toPascalCase(pluginName)}Component', ${toPascalCase(pluginName)}Component);
    console.log('${pluginName} installed');
  }
};
`;
  fs.writeFileSync(path.join(newPluginDir, 'index.ts'), indexContent);

  // Create Component
  const componentContent = `<template>
  <div class="p-4 border border-green-500 rounded bg-green-50">
    <h2 class="text-xl font-bold text-green-700">${toPascalCase(pluginName)} Component</h2>
    <p>This is a component for ${pluginName}.</p>
  </div>
</template>
`;
  fs.writeFileSync(path.join(newPluginDir, `${toPascalCase(pluginName)}Component.vue`), componentContent);

  // Create package.json
  const packageJson = {
    name: pluginName,
    version: '0.0.0',
    description: `Plugin ${pluginName}`,
    main: 'index.ts'
  };
  fs.writeFileSync(path.join(newPluginDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  console.log(`Plugin "${pluginName}" created at plugins/${pluginName}`);

  const addToMain = await askQuestion('Do you want to automatically add this plugin to main.ts? (y/n): ');
  if (addToMain.toLowerCase() === 'y') {
      addPluginToMainTs(pluginName);
  }
}

function updateMainTs(includeExample) {
    const mainTsPath = path.join(__dirname, '..', 'src', 'main.ts');
    let content = fs.readFileSync(mainTsPath, 'utf-8');

    if (!includeExample) {
        // Remove import and comment
        content = content.replace(/\/\/ Import example plugin\n\/\/ In a real scenario, you might dynamic import this or have a configuration file\n/, '');
        content = content.replace(/import ExamplePlugin from '@plugins\/example-plugin'\n/, '');

        // Remove usage and comment
        content = content.replace(/\n\/\/ Use the example plugin\n/, '');
        content = content.replace(/app.use\(ExamplePlugin\)\n/, '');
    }

    fs.writeFileSync(mainTsPath, content);
}

function addPluginToMainTs(pluginName) {
    const mainTsPath = path.join(__dirname, '..', 'src', 'main.ts');
    let content = fs.readFileSync(mainTsPath, 'utf-8');

    const pascalName = toPascalCase(pluginName) + 'Plugin';
    const importStatement = `import ${pascalName} from '@plugins/${pluginName}'\n`;

    // Add import after last import
    const lastImportIndex = content.lastIndexOf('import ');
    const endOfLastImport = content.indexOf('\n', lastImportIndex);

    content = content.slice(0, endOfLastImport + 1) + importStatement + content.slice(endOfLastImport + 1);

    // Add use
    const mountIndex = content.indexOf('app.mount');
    content = content.slice(0, mountIndex) + `app.use(${pascalName})\n` + content.slice(mountIndex);

    fs.writeFileSync(mainTsPath, content);
    console.log(`Added ${pluginName} to src/main.ts`);
}

function toPascalCase(str) {
  return str.replace(/(^\w|-\w)/g, clearAndUpper);
}

function clearAndUpper(text) {
  return text.replace(/-/, "").toUpperCase();
}

main();
