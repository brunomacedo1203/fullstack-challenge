import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
