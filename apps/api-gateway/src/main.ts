// Temporary bootstrap placeholder until NestJS modules are implemented.
export function bootstrap(): void {
  console.log('API Gateway placeholder running');
  setInterval(() => {
    console.log('API Gateway heartbeat');
  }, 60_000);
}

if (require.main === module) {
  bootstrap();
}
