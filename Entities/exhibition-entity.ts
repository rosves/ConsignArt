import { ExhibitionType } from '../common/enum';

export class Exhibition {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    location: string | null; 
    type: ExhibitionType;
    description: string | null;
    galleryId: string;       
    createdAt: Date;
    updatedAt: Date;
}