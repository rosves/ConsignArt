export class Loan {
    id: string;
    artworkId: string;           
    borrowingGalleryId: string;  
    startDate: Date;
    endDate: Date;
    returnedAt: Date | null;     
    conditions: string | null;
    createdAt: Date;
    updatedAt: Date;
}