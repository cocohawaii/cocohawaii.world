# Coco Hawaii Website

A modern e-commerce website for custom hand-painted art fashion hats, built with Next.js and Wix Headless CMS.

## Features

- 🎨 Beautiful, modern UI with rainbow gradient buttons
- 🛍️ Product catalog with collections
- 🎩 Single product pages with ordering functionality
- 💳 Payment integration (PayPal & Credit Card)
- 📱 Fully responsive design
- ⚡ Optimized performance with Next.js
- 🔄 Real-time data from Wix Headless CMS

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Wix Headless CMS

1. Go to your Wix dashboard and enable Headless CMS
2. Create an API key in your Wix site settings
3. Get your Site ID from your Wix site settings

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory (or use the provided `.env.local` template):

```env
# Wix Configuration
NEXT_PUBLIC_WIX_CLIENT_ID=f70e4578-88dd-4e18-a162-f0b64f4dd734
NEXT_PUBLIC_WIX_ACCOUNT_ID=1510fbf9-5839-46ae-a724-04b3460c1057
NEXT_PUBLIC_WIX_SITE_ID=your_wix_site_id_here
NEXT_PUBLIC_WIX_API_KEY=your_wix_api_key_here

# PayPal Configuration (optional, for payment processing)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id_here
```

**Important:** Replace `your_wix_site_id_here` and `your_wix_api_key_here` with your actual Wix Site ID and API Key.

**Note:** The Wix API Key should be your OAuth access token or API key from Wix. For production, use environment-specific keys.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
npm run build
npm start
```

## Wix CMS Collections Required

### Collection: `hats`
Product items with the following fields (exact field names as in your original code):

- `title` (Text) - Hat title
- `hatSubtitle` (Text, optional) - Hat subtitle
- `hatDescription` (Text, optional) - Detailed description
- `price` (Number) - Regular price
- `discountedPrice` (Number, optional) - Discounted price (if 0 or empty, regular price is used)
- `mainHatImage` (Image) - Main product image
- `topVideoEyes` (Video, optional) - Top video
- `makingOfProductPage` (Video, optional) - Making of video
- `gallery` (Multi-image) - Gallery images array
- `hatSize` (Text, optional) - Available size (e.g., "M", "L")
- `collection` (Reference to collections) - Which collection this hat belongs to

### Collection: `collections`
Hat collections with fields:

- `name` (Text) - Collection name
- `description` (Text, optional) - Collection description
- `image` (Image, optional) - Collection image

### Collection: `hatOrders`
Order submissions with fields:

- `hatorderName` (Text) - Customer name
- `hatorderEmail` (Text) - Customer email
- `hatorderMobile` (Text) - Customer mobile
- `hatorderCustomAsk` (Text, optional) - Additional description/requests
- `hatOrderPrice` (Number) - Product price
- `hatOrderSubtitle` (Text, optional) - Hat subtitle
- `hatOrdertitle` (Text) - Hat title
- `hatOrderCreatedOn` (Date) - Order creation date
- `hatOrderID` (Text) - Unique order ID (format: CHhatOrder1, CHhatOrder2, etc.)
- `shippingCost` (Number, optional) - Shipping cost
- `totalFinalCost` (Number, optional) - Total order cost
- `orderAddress` (Text, optional) - Shipping address

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── orders/        # Order API endpoints
│   ├── collections/       # Collections pages
│   ├── hats/              # Individual hat pages
│   ├── page.tsx           # Homepage
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── HatProductPage.tsx # Product page component
│   ├── Layout.tsx         # Site layout
│   └── RainbowButton.tsx  # Rainbow gradient button
├── lib/                   # Utilities
│   └── wix.ts            # Wix Headless CMS integration
└── public/               # Static assets
```

## Pages

- `/` - Homepage with featured collections and hats
- `/collections` - All collections listing
- `/collections/[id]` - Hats in a specific collection
- `/hats/[id]` - Individual hat product page with ordering
- `/create-your-hat` - Custom hat creation page
- `/thank-you` - Order confirmation page
- `/login` - Login page

## Customization

### Rainbow Buttons
The rainbow gradient buttons can be customized in `components/RainbowButton.tsx` and `tailwind.config.js`.

### Styling
The site uses Tailwind CSS. Customize colors, fonts, and styles in:
- `tailwind.config.js` - Tailwind configuration
- `app/globals.css` - Global styles and custom CSS

## Wix API Integration

The Wix integration uses the Wix Data API (REST). The API calls are made through:
- Server-side: Direct API calls in `lib/wix.ts`
- Client-side: API routes in `app/api/orders/route.ts` (for security)

Make sure your Wix API key has permissions to:
- Read from `hats` and `collections` collections
- Create and update items in `hatOrders` collection

## Payment Integration

PayPal integration is included using `@paypal/react-paypal-js`. To enable:
1. Get a PayPal Client ID from PayPal Developer Dashboard
2. Add it to `.env.local` as `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
3. For credit card payments, integrate your preferred payment gateway

## Support

For issues or questions, please check:
- [Next.js Documentation](https://nextjs.org/docs)
- [Wix Headless CMS Documentation](https://dev.wix.com/docs/rest/api-reference/wix-headless-cms)
