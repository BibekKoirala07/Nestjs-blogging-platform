import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    let token = this.extractTokenFromHeader(request);

    if (!token) {
      token = request.body.token;
    }

    if (!token) {
      throw new UnauthorizedException('No token provided for request');
    }

    // console.log('token', token);

    try {
      const user = this.jwtService.verify(token);
      console.log('user in guards', user);
      request.user = user
      return true;
    } catch (error) {
      console.log('error in token', error);
      throw new UnauthorizedException(error.message || 'Something went wrong');
    }
  }

  private extractTokenFromHeader(request): string | null {
    const authorizationHeader = request.headers['authorization'];
    if (!authorizationHeader) return null;

    const parts = authorizationHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }
    return null;
  }
}
