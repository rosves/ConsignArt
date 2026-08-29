import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../Entities/sale-entity';
import { Artwork } from '../Entities/artwork-entity';
import { User } from '../Entities/user-entity';
import { Artist } from '../Entities/artist-entity';
import { ArtworkStatus } from '../common/enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(Artwork)
    private readonly artworkRepository: Repository<Artwork>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
  ) {}
  async getArtistStats(userId: string) {
  const artist = await this.artistRepository.findOne({
    where: { userAccountId: userId }
  });

  if (!artist) {
    throw new NotFoundException('Artist profile not found');
  }

  const sales = await this.saleRepository
    .createQueryBuilder('sale')
    .innerJoin('sale.artwork', 'artwork')
    .where('artwork.artistId = :artistId', { artistId: artist.id })
    .select([
      'SUM(sale.salePrice) as totalSales',
      'SUM(sale.commissionAmount) as totalCommissions',
      'COUNT(sale.id) as salesCount',
    ])
    .getRawOne();

  const availableArtworks = await this.artworkRepository.count({
    where: { artistId: artist.id, status: ArtworkStatus.AVAILABLE },
  });

  return {
    totalSales: parseInt(sales.totalsales || '0'),
    totalCommissions: parseInt(sales.totalcommissions || '0'),
    salesCount: parseInt(sales.salescount || '0'),
    availableArtworks,
  };
}

async getGalleryStats(galleryId: string) {
  // CA total + ventes par mois
  const salesStats = await this.saleRepository
    .createQueryBuilder('sale')
    .innerJoin('sale.artwork', 'artwork')
    .innerJoin('artwork.artist', 'artist')
    .where('artist.galleryId = :galleryId', { galleryId })
    .select([
      'SUM(sale.salePrice) as totalRevenue',
      'COUNT(sale.id) as totalSales',
      "DATE_TRUNC('month', sale.soldAt) as month",
    ])
    .groupBy("DATE_TRUNC('month', sale.soldAt)")
    .getRawMany();

  // Top 5 artistes
  const topArtists = await this.saleRepository
    .createQueryBuilder('sale')
    .innerJoin('sale.artwork', 'artwork')
    .innerJoin('artwork.artist', 'artist')
    .where('artist.galleryId = :galleryId', { galleryId })
    .select([
      'artist.id as artistId',
      'artist.firstName as firstName',
      'artist.lastName as lastName',
      'SUM(sale.salePrice) as totalSales',
    ])
    .groupBy('artist.id, artist.firstName, artist.lastName')
    .orderBy('totalSales', 'DESC')
    .limit(5)
    .getRawMany();

  return {
    salesStats,
    topArtists,
  };
}

async getAdminStats() {
  const activeUsers = await this.userRepository.count({
    where: { isActive: true },
  });

  const transactionStats = await this.saleRepository
    .createQueryBuilder('sale')
    .select([
      'COUNT(sale.id) as totalTransactions',
      'SUM(sale.salePrice) as totalVolume',
      'SUM(sale.commissionAmount) as totalCommissions',
    ])
    .getRawOne();

  return {
    activeUsers,
    totalTransactions: parseInt(transactionStats.totaltransactions || '0'),
    totalVolume: parseInt(transactionStats.totalvolume || '0'),
    totalCommissions: parseInt(transactionStats.totalcommissions || '0'),
  };
}
}