export class Sale {
    id: string;
    artworkId: string;              
    buyerId: string;                
    salePrice: number;              
    commissionRate: number;         
    commissionAmount: number;      
    artistAmount: number;           
    soldAt: Date;
    invoiceRef: string | null;
    artistStatementRef: string | null;
    createdAt: Date;
}