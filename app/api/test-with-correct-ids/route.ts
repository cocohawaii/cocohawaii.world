import { NextRequest, NextResponse } from 'next/server';

// Test with the correct Site ID and Metasite ID
const SITE_ID = '9aaa89a5-25af-48f6-9c3f-88d916792133';
const METASITE_ID = 'e2051e40-d8bd-4f0b-b7e4-f04012108b4e';
const ACCOUNT_ID = '1510fbf9-5839-46ae-a724-04b3460c1057';
const CLIENT_ID = 'f70e4578-88dd-4e18-a162-f0b64f4dd734';
const IST_TOKEN = 'IST.eyJraWQiOiJQb3pIX2FDMiIsImFsZyI6IlJTMjU2In0.eyJkYXRhIjoie1wiaWRcIjpcIjM3ZDhlYzFkLTJlODEtNGEyMC1hZTg1LTFmYTk4NTgxNzJkZlwiLFwiaWRlbnRpdHlcIjp7XCJ0eXBlXCI6XCJhcHBsaWNhdGlvblwiLFwiaWRcIjpcIjQwMWI3ZmYzLTY1MDgtNGUxZS1hNzQ1LWM1MGYzNTNlOTRkMFwifSxcInRlbmFudFwiOntcInR5cGVcIjpcImFjY291bnRcIixcImlkXCI6XCIxNTEwZmJmOS01ODM5LTQ2YWUtYTcyNC0wNGIzNDYwYzEwNTdcIn19IiwiaWF0IjoxNzY3ODk1OTc1fQ.L0vyqe7C5xjhufk9wnU5I4c6X3S8X41VAEfyU0uvXgl6k984rHZXhNVnLkZdSAUptVyZZ507reVFv3qFVd9R8PPlYTFJbM5thh0ztuNLoLNB23vPZDi-SVXI_8nhSUtMHja6fLTb1Vmcx2njXv_v76YegzQHz7xhTGxs7JY7n7ZNSndJR9SpIUK6JBeWYu3S7J7OJo7o9jcM9eCaw2mfsToafTH7SJ3JhUSVUeS9fG0syaWfUA5trdU5la3Jm2HLHv-t592G7HCwljAhFjpzfamULJP7g7QkgsuL7wbzqoUNks47Zsw-0pCA8E8cob8k-EHyM-oKPsp-pe-PmSGr3Q';

export async function GET(request: NextRequest) {
  const results: any = {
    test: 'Testing with correct Site ID and Metasite ID',
    siteId: SITE_ID,
    metasiteId: METASITE_ID,
    accountId: ACCOUNT_ID,
    clientId: CLIENT_ID,
    tests: [],
  };

  const collectionName = 'CocoHawaiiExoticHats';
  const baseUrls = [
    'https://www.wixapis.com/data/v1',
    'https://www.wixapis.com/site-data/v1',
    'https://www.wixapis.com/cms/v1',
  ];

  // Test 1: Try with Site ID
  for (const baseUrl of baseUrls) {
    const url = `${baseUrl}/collections/${encodeURIComponent(collectionName)}/items`;
    const headers = {
      'Authorization': IST_TOKEN,
      'wix-site-id': SITE_ID,
      'wix-account-id': ACCOUNT_ID,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, { headers });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text.substring(0, 200) };
      }

      results.tests.push({
        test: `Site ID (${SITE_ID}) with ${baseUrl}`,
        url,
        status: response.status,
        success: response.ok,
        data: response.ok ? data : { error: data },
      });
    } catch (error: any) {
      results.tests.push({
        test: `Site ID (${SITE_ID}) with ${baseUrl}`,
        error: error.message,
      });
    }
  }

  // Test 2: Try with Metasite ID
  for (const baseUrl of baseUrls) {
    const url = `${baseUrl}/collections/${encodeURIComponent(collectionName)}/items`;
    const headers = {
      'Authorization': IST_TOKEN,
      'wix-site-id': METASITE_ID,
      'wix-account-id': ACCOUNT_ID,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, { headers });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text.substring(0, 200) };
      }

      results.tests.push({
        test: `Metasite ID (${METASITE_ID}) with ${baseUrl}`,
        url,
        status: response.status,
        success: response.ok,
        data: response.ok ? data : { error: data },
      });
    } catch (error: any) {
      results.tests.push({
        test: `Metasite ID (${METASITE_ID}) with ${baseUrl}`,
        error: error.message,
      });
    }
  }

  // Test 3: Try listing all collections with Site ID
  try {
    const url = 'https://www.wixapis.com/data/v1/collections';
    const response = await fetch(url, {
      headers: {
        'Authorization': IST_TOKEN,
        'wix-site-id': SITE_ID,
        'wix-account-id': ACCOUNT_ID,
        'Content-Type': 'application/json',
      },
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text.substring(0, 200) };
    }

    results.listCollections = {
      status: response.status,
      success: response.ok,
      data: response.ok ? data : { error: data },
    };
  } catch (error: any) {
    results.listCollections = { error: error.message };
  }

  // Test 4: Try listing all collections with Metasite ID
  try {
    const url = 'https://www.wixapis.com/data/v1/collections';
    const response = await fetch(url, {
      headers: {
        'Authorization': IST_TOKEN,
        'wix-site-id': METASITE_ID,
        'wix-account-id': ACCOUNT_ID,
        'Content-Type': 'application/json',
      },
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text.substring(0, 200) };
    }

    results.listCollectionsMetasite = {
      status: response.status,
      success: response.ok,
      data: response.ok ? data : { error: data },
    };
  } catch (error: any) {
    results.listCollectionsMetasite = { error: error.message };
  }

  return NextResponse.json(results, { status: 200 });
}
