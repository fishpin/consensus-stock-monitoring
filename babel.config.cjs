// Replace `import.meta.env.VITE_*` with `undefined` in Jest so tests don't
// crash on the Vite-only `import.meta` syntax.
const importMetaEnvPlugin = {
  visitor: {
    MetaProperty(path) {
      if (
        path.node.meta.name === 'import' &&
        path.node.property.name === 'meta'
      ) {
        // Replace import.meta with an object that has an empty env
        path.replaceWithSourceString('({ env: {} })');
      }
    },
  },
};

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [importMetaEnvPlugin],
};
