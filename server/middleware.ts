import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { verifyJWT, type AuthUser, sanitizeUser } from "./auth";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Token de acesso requerido" });
  }

  try {
    const decoded = verifyJWT(token);
    if (!decoded) {
      return res.status(403).json({ message: "Token inválido" });
    }

    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(403).json({ message: "Usuário não encontrado" });
    }

    req.user = sanitizeUser(user);
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token inválido" });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  authenticateToken(req, res, next);
}