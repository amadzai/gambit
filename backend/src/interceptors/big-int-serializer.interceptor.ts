import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Recursively transforms any BigInt values in an object to strings
 * Handles nested objects, arrays, and primitive values
 * @param data - Any object or value that might contain BigInt values
 * @returns The same structure with all BigInt values converted to strings
 */
function serializeBigInt(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'bigint') {
    return data.toString();
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeBigInt(item));
  }

  if (typeof data === 'object' && data.constructor === Object) {
    const result: Record<string, unknown> = {};
    const source = data as Record<string, unknown>;

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        result[key] = serializeBigInt(source[key]);
      }
    }

    return result;
  }

  return data;
}

/**
 * Global interceptor that automatically serializes BigInt values to strings
 * in API response data to ensure JSON compatibility
 */
@Injectable()
export class BigIntSerializerInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map((data) => serializeBigInt(data)));
  }
}
