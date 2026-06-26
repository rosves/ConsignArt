import { ArtworkStatus, ArtworkTechnics } from '../common/enum';
import { Dimensions } from '../common/value-object';

export class Artwork {
    id: string;
    title: string;
    description: string | null;
    creationYear: number;
    technique: ArtworkTechnics;
    dimensions: Dimensions | null; 
    sellPrice: number;             
    reservePrice: number;          
    status: ArtworkStatus;
    imageURL: string | null;
    consignedAt: Date;
    artistId: string;             
    createdAt: Date;
    updatedAt: Date;
}