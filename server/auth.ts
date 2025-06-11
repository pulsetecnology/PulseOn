import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import type { User } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "pulseon-secret-key";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(): string {
  return uuidv4();
}

export function generateSessionExpiry(): Date {
  return new Date(Date.now() + SESSION_DURATION);
}

export function generateJWT(user: User): string {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email 
    }, 
    JWT_SECRET, 
    { expiresIn: "7d" }
  );
}

export function verifyJWT(token: string): { userId: number; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

export type AuthUser = {
  id: number;
  email: string;
  name: string | null;
  onboardingCompleted: boolean;
};

export function sanitizeUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    onboardingCompleted: user.onboardingCompleted
  };
}