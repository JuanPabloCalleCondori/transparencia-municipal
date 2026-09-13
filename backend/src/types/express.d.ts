import type { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & {
        idUsuario: number;
        email: string;
        rol: string;
      };
    }
  }
}

export {};
