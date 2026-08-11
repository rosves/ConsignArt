import { SetMetadata } from '@nestjs/common';

/**
 * Allow the route to be public
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);