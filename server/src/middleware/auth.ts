import type { Request, Response, NextFunction } from 'express';
import { auth } from '../auth/index.js';
import { fromNodeHeaders } from 'better-auth/node';

// Extend Express Request with user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware that validates the session and attaches user to req.user
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    req.user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: (session.user as any).role || 'karyawan',
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid session' });
  }
}

/**
 * Middleware factory that checks if user has one of the allowed roles
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    next();
  };
}
