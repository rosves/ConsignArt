import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import appConfig from './configurations/app.config';
import databaseConfig from './configurations/database.config';
import jwtConfig from './configurations/jwt.config';
import { validate } from './validations/env.validation';

@Global()
@Module({
    imports: [
        NestConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, databaseConfig, jwtConfig],
            validate,
            envFilePath: '.env',
            cache: true,
        }),
    ],
    exports: [NestConfigModule],
})
export class ConfigModule { }
