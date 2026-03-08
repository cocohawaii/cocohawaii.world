# Wix Headless CMS API Setup Guide

## API Endpoint Structure

The Wix Headless CMS uses the Wix Data API. The base URL is:
```
https://www.wixapis.com/data/v1
```

## Authentication

Wix Headless CMS requires authentication via:
- **API Key**: Your Wix API key (OAuth token or API key)
- **Site ID**: Your Wix site ID

These should be set in your `.env.local` file:
```env
NEXT_PUBLIC_WIX_SITE_ID=your_site_id
NEXT_PUBLIC_WIX_API_KEY=your_api_key
```

## API Headers

All requests require:
```
Authorization: {your_api_key}
wix-site-id: {your_site_id}
Content-Type: application/json
```

## Collection Endpoints

### Get Items
```
GET /collections/{collectionName}/items
```

Query parameters:
- `filter`: JSON string for filtering (e.g., `{"_id": "123"}`)
- `sort`: JSON array for sorting (e.g., `[{"fieldName": "price", "order": "ASC"}]`)
- `limit`: Number of items to return

### Create Item
```
POST /collections/{collectionName}/items
```

Body:
```json
{
  "dataItem": {
    "field1": "value1",
    "field2": "value2"
  }
}
```

### Update Item
```
PATCH /collections/{collectionName}/items/{itemId}
```

Body:
```json
{
  "dataItem": {
    "field1": "newValue1"
  }
}
```

## Response Format

### Success Response
```json
{
  "items": [
    {
      "_id": "item_id",
      "field1": "value1",
      "field2": "value2"
    }
  ]
}
```

### Error Response
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## Field Types in Wix CMS

When creating collections in Wix, use these field types:
- **Text**: For strings (title, hatSubtitle, etc.)
- **Number**: For prices and numeric values
- **Image**: For single images (mainHatImage)
- **Video**: For video fields (topVideoEyes, makingOfProductPage)
- **Multi-image**: For gallery arrays
- **Date**: For dates (hatOrderCreatedOn)
- **Reference**: For relationships (collection field referencing collections)

## Testing the API

You can test your Wix API connection using curl:

```bash
curl -X GET \
  'https://www.wixapis.com/data/v1/collections/hats/items?limit=10' \
  -H 'Authorization: YOUR_API_KEY' \
  -H 'wix-site-id: YOUR_SITE_ID'
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check that your API key is correct
   - Verify your Site ID is correct
   - Ensure your API key has the right permissions

2. **404 Not Found**
   - Verify the collection name matches exactly (case-sensitive)
   - Check that the collection exists in your Wix CMS

3. **Field Not Found**
   - Ensure field names match exactly (case-sensitive)
   - Check that fields exist in your Wix CMS collection

4. **CORS Errors**
   - Wix API should handle CORS, but if issues occur, ensure you're making requests from server-side (API routes) for write operations

## Alternative: Using Wix SDK

If you prefer using the Wix SDK instead of REST API, you can install and use:

```bash
npm install @wix/sdk
```

Then import and use:
```typescript
import { wixClient } from '@wix/sdk';
```

However, the REST API approach used in this project is more straightforward for Next.js applications.
