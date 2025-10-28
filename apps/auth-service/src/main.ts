// Placeholder bootstrap for the Auth Service; replace with NestJS logic later.
export function bootstrap(): void {
  console.log('Auth service placeholder running');
  setInterval(() => {
    console.log('Auth service heartbeat');
  }, 60_000);
}

if (require.main === module) {
  bootstrap();
}
