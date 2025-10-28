// Placeholder bootstrap for the Notifications Service.
export function bootstrap(): void {
  console.log('Notifications service placeholder running');
  setInterval(() => {
    console.log('Notifications service heartbeat');
  }, 60_000);
}

if (require.main === module) {
  bootstrap();
}
