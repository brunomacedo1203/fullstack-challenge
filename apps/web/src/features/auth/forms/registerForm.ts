import { z } from 'zod';

export const registerFormSchema = z.object({
  email: z.string().email('E-mail inválido'),
  username: z
    .string()
    .min(3, 'Username deve ter ao menos 3 caracteres')
    .regex(/^[a-zA-Z0-9_\-]+$/, 'Use apenas letras, números, _ e -'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
