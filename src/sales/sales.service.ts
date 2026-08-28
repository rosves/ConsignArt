import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../Entities/sale-entity';
import { Artwork } from '../Entities/artwork-entity';
import { ArtworkStatus } from '../common/enum';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ArtworkStatusHistory } from '../Entities/artworkStatusHistory-entity';
import { BusinessRuleException } from 'src/common/filters/business-rule.exception';

@Injectable()
export class SalesService {
    constructor(
        @InjectRepository(Sale)
        private readonly saleRepository: Repository<Sale>,
        @InjectRepository(Artwork)
        private readonly artworkRepository: Repository<Artwork>,
    ) { }
    private calculateCommissionRate(salePrice: number): number {
        if (salePrice <= 500000) {
            return 40;
        } else if (salePrice <= 2000000) {
            return 35;
        } else {
            return 30;
        }
    }
    private calculateCommissionAmount(salePrice: number, rate: number): number {
        return salePrice * (rate / 100);
    }
    private calculateArtistAmount(salePrice: number, commissionAmount: number): number {
        return salePrice - commissionAmount;
    }
    public async create(dto: CreateSaleDto): Promise<Sale> {
        // 1. Vérifier que l'œuvre existe et est vendable
        const artwork = await this.artworkRepository.findOne({
            where: { id: dto.artworkId }
        });

        if (!artwork) {
            throw new NotFoundException(`Artwork ${dto.artworkId} not found`);
        }
        if (artwork.status !== ArtworkStatus.AVAILABLE) {
            throw new BusinessRuleException('Artwork is not available for sale');

        }

        if (dto.salePrice < artwork.reservePrice) {
            throw new BusinessRuleException('Sale price is below reserve price');
        }
        // 2. Calculer commission
        const commissionRate = this.calculateCommissionRate(dto.salePrice);
        const commissionAmount = this.calculateCommissionAmount(dto.salePrice, commissionRate);
        const artistAmount = this.calculateArtistAmount(dto.salePrice, commissionAmount);
        // 3. Transaction : créer Sale + passer Artwork en SOLD + créer ArtworkStatusHistory
        return await this.saleRepository.manager.transaction(async (manager) => {
            const sale = manager.create(Sale, {
                artworkId: dto.artworkId,
                buyerId: dto.buyerId,
                salePrice: dto.salePrice,
                commissionRate,
                commissionAmount,
                artistAmount,
                soldAt: new Date(),
            });

            await manager.save(Sale, sale);
            artwork.status = ArtworkStatus.SOLD;
            await manager.save(Artwork, artwork);
            // si une étape échoue → tout est annulé (rollback)
            const history = manager.create(ArtworkStatusHistory, {
                artworkId: dto.artworkId,
                fromStatus: ArtworkStatus.AVAILABLE,
                toStatus: ArtworkStatus.SOLD,
                reason: 'Sold to collector',
                changedById: dto.buyerId,
            });

            await manager.save(ArtworkStatusHistory, history);

            return sale;
        });
    }
}
