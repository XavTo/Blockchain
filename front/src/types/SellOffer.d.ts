export interface SellOffer {
  id: number;
  nftoken_id: string;
  seller: number; // User ID
  seller_username: string;
  amount: string; // en drops
  destination: string | null;
  offer_index: string;
  created_at: string;
  status: string; // 'active', 'accepted', 'canceled'
  image?: string; // URL de l'image du NFT
}
