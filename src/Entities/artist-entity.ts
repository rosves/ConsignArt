import { ArtistStatus } from "src/common/enum";

export class Artist {
  id: string;
  firstName: string;
  lastName: string;
  biography: string | null;
  portfolioURL: string | null;
  nationality: string | null;
  enterAt: Date;
  status: ArtistStatus;
  galleryId: string;
  userAccountId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
