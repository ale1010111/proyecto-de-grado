// src/utils/passwordSchema.ts

import { z } from "zod";

const SECUENCIAS_OBVIAS = [
  "123456", "654321", "012345", "234567", "345678",
  "456789", "567890", "111111", "000000", "999999",
  "123123", "321321", "112233", "aaaaaa", "abcdef",
];

/**
 * Validación de contraseña segura (espejo del backend).
 * Reutilizable en cualquier formulario que requiera nueva contraseña.
 *
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Al menos una mayúscula
 * - Al menos un número
 * - Al menos un carácter especial
 * - Sin secuencias numéricas obvias
 */
export const passwordSeguroSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .refine(val => /[A-Z]/.test(val), {
    message: "Debe contener al menos una letra mayúscula",
  })
  .refine(val => /\d/.test(val), {
    message: "Debe contener al menos un número",
  })
  .refine(val => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(val), {
    message: "Debe contener al menos un carácter especial (!@#$%...)",
  })
  .refine(
    val => !SECUENCIAS_OBVIAS.some(seq => val.toLowerCase().includes(seq)),
    { message: "No puede contener secuencias obvias como '123456'" }
  );

/**
 * Texto de ayuda para mostrar bajo el campo de contraseña.
 */
export const PASSWORD_HELP_TEXT =
  "Mínimo 8 caracteres, una mayúscula, un número y un carácter especial (!@#$%...).";