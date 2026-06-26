import { ArtworkStatus } from '../common/enum';

export class ArtworkStatusHistory {
    id: string;
    artworkId: string;               
    fromStatus: ArtworkStatus | null; 
    toStatus: ArtworkStatus;
    reason: string | null;
    changedById: string | null;       
    createdAt: Date;
}