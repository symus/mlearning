import bcrypt from "bcryptjs";

const ROUNDS = 12;

export function hashSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifySecret(plain: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) return Promise.resolve(false);
  return bcrypt.compare(plain, hash);
}
