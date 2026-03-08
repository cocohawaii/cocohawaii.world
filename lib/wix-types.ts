// Wix CMS Types
// Extended types for auction bidding system

export interface Hat {
  _id: string;
  title: string;
  hatSubtitle?: string;
  hatDescription?: string;
  price: number;
  discountedPrice?: number;
  mainHatImage?: string;
  topVideoEyes?: string;
  makingOfProductPage?: string;
  gallery?: Array<{ src: string; alt?: string }>;
  hatSize?: string;
  collection?: string;
  slug?: string;
  isActive?: boolean;
  isSold?: boolean;
  createdAt?: string;
}

export interface Collection {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  slug?: string;
}

// Auction Bidding Types
export interface ArtCreationBidding {
  _id: string;
  itemAuctionId?: string;
  bidItemName: string;
  bidItemType?: string;
  imageBidItem?: string;
  
  // Dates
  launchBidItemDate: string | Date;
  auctionItemEndDate: string | Date;
  auctionItemVisibleDate?: string | Date;
  
  // Status
  activeBidItem: boolean;
  
  // Bidding
  bidAmount: number;
  bidPrice: number;
  bidIncreaseRate: number;
  bidPriceDivision?: number;
  
  // Price system
  artBasePrice: number;
  artPriceIncrease: string; // e.g., "€10" or "10%"
  increaseRate: number; // milliseconds
  artPriceIncreasedTotalCount?: number;
  artPriceIncreasedTotal?: string;
  artPriceFinalTotal?: string;
  
  // Countdown
  totalCountdown: string; // e.g., "2 days"
  totalCountDone?: string;
  totalCountdownLeft?: string;
  totalTimeElapsedMs?: number;
  
  // Stats
  allUsersBidCount?: number;
  allUsersBidAmount?: number;
  allUsersBidPriceAmount?: number;
  
  // Filtering
  tagItemType?: string | string[];
}

export interface Raffle {
  _id: string;
  name: string;
  subtitle?: string;
  isActive: boolean;
  visibilityDate: string;
  startDate: string;
  endDate: string;
  ticketLimit: number;
  ticketCostStars: number;
  ticketLimitPerUser?: number;
  valueOfPot?: number;
  hatIds?: string[];
  winnerNumber?: number;
  winnerInitials?: string;
  winnerDisplayName?: string;
}

export interface RaffleEntry {
  _id: string;
  raffleId: string;
  memberId?: string;
  memberEmail?: string;
  ticketCount: number;
  createdAt?: string;
}

export interface ArtAllBidsMade {
  _id: string;
  itemId: string;
  itemAuctionId?: string;
  itemName: string;
  itemType?: string;
  itemImage?: string;
  
  bidAmount: number;
  bidPrice: number;
  userBidCount: number;
  userBidAmount: number;
  userBidPriceAmount: number;
  
  bidDate: string | Date;
  
  memberEmail: string;
  memberUsername: string;
  memberId: string;
  memberName?: string;
  
  totalCountdownLeft?: string;
  artPriceFinalTotal?: string;
  
  itemWinners?: string; // "Winner" if won
}

export interface Member {
  _id: string;
  memberId: string;
  memberemail: string;
  memberUsername: string;
  memberUsernameIfAnonymous?: string;
  memberName?: string;
  memberPhone?: string;
  memberPhonecode?: string;
  
  starBids: number;
  starBidsConsumed?: number;
  itemsWon?: number;
  
  incognitoStatus?: boolean;
  
  bidPackQuantity?: number;
  bidPacksOrderValue?: number;
  
  memberTag?: string | string[];
  
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  
  createdDateTime?: string | Date;
}

export interface StarBidPack {
  _id: string;
  bidPacksId: string;
  bidPacksName: string;
  bidPackDetail?: string;
  bidPacksStarsAmount: number;
  bidPacksPrice: number;
  activeBidPack: boolean;
  auctionType?: string;
}

export interface StarBidPackPurchase {
  _id: string;
  userWallet?: string;
  bidPackId: string;
  bidPackName: string;
  quantity: number;
  totalStars: number;
  totalPriceETH?: number;
  totalPriceEUR: number;
  gasUsed?: number;
  gasPrice?: number;
  gasFeeETH?: number;
  gasFeeEUR?: number;
  transactionHash?: string;
  orderDate: string | Date;
  paymentStatus: string;
  paymentMethod?: string;
  memberEmail?: string;
  memberName?: string;
  memberUsername?: string;
  memberId?: string;
  orderId?: string;
}

export interface StarBidPromo {
  _id: string;
  starPromoName: string;
  starBidPromo: number;
  starBidPromoEnds?: string | Date;
  activePromo: boolean;
}
