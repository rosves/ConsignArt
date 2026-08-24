import { Injectable, PipeTransform, ArgumentMetadata } from "@nestjs/common";   

@Injectable()
export class NormalizeEmailPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
        if (value && value.email) {
            value.email = value.email.toLowerCase();
        }
        return value;
    }
}
