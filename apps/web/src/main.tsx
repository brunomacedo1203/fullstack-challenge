export function createPlaceholderApp(): void {
  console.log('Web app placeholder running');
  setInterval(() => {
    console.log('Web app heartbeat');
  }, 60_000);
}

createPlaceholderApp();

export default createPlaceholderApp;
