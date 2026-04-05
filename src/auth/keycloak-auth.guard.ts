import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';

type AuthenticatedRequest = Request & { user?: JWTPayload };

@Injectable()
export class KeycloakAuthGuard implements CanActivate {
  private readonly issuerUrl?: string;
  private readonly audience?: string;
  private readonly jwksUrl?: string;
  private jwks?: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    this.issuerUrl = this.configService.get<string>('KEYCLOAK_ISSUER_URL') || undefined;
    this.audience = this.configService.get<string>('KEYCLOAK_AUDIENCE') || undefined;
    this.jwksUrl = this.configService.get<string>('KEYCLOAK_JWKS_URL') || undefined;
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic || !this.issuerUrl || !this.audience) {
      return true;
    }

    return this.validateRequest(context);
  }

  private async validateRequest(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token.');
    }

    const token = header.slice('Bearer '.length).trim();

    if (!token) {
      throw new UnauthorizedException('Empty Bearer token.');
    }

    try {
      const { payload } = await jwtVerify(token, this.getJwks(), {
        issuer: this.issuerUrl,
        audience: this.audience,
      });

      request.user = payload;
      return true;
    } catch (error) {
      console.error('Keycloak token verification failed:', error);
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }

  private getJwks() {
    if (!this.jwks) {
      const jwksEndpoint =
        this.jwksUrl || `${this.issuerUrl}/protocol/openid-connect/certs`;
      this.jwks = createRemoteJWKSet(new URL(jwksEndpoint));
    }

    return this.jwks;
  }
}
