module.exports = {
  id: 'hello-plugin',
  description: 'A sample plugin that greets the user.',
  greet: async ({ name }) => {
    return `Hello, ${name || 'World'}!`;
  }
}; 