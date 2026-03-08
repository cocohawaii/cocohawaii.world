'use client';

import { useState, useEffect } from 'react';

export default function DebugPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testWixConnection() {
      try {
        setLoading(true);
        setError(null);

        // Test fetching from CocoHawaiiExoticHats collection
        const [debugResponse, collectionsResponse, testResponse] = await Promise.all([
          fetch('/api/debug-wix'),
          fetch('/api/list-collections').catch(() => null), // Don't fail if this endpoint doesn't exist
          fetch('/api/test-wix-connection').catch(() => null), // Test connection
        ]);
        
        const debugData = await debugResponse.json();
        
        // Try to get list of all collections
        let collectionsData = null;
        if (collectionsResponse) {
          try {
            collectionsData = await collectionsResponse.json();
          } catch {
            // Ignore if collections endpoint fails
          }
        }

        // Get test connection data
        let testData = null;
        if (testResponse) {
          try {
            testData = await testResponse.json();
          } catch {
            // Ignore if test endpoint fails
          }
        }
        
        setStatus({
          ...debugData,
          allCollections: collectionsData,
          connectionTest: testData,
        });
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    testWixConnection();
  }, []);

  return (
    <div className="min-h-screen py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Wix CMS Debug Page</h1>
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 font-semibold mb-2">🔧 Troubleshooting Guide</p>
          <p className="text-blue-700 text-sm mb-3">
            All endpoints are returning 404. This usually means the <strong>Site ID is incorrect</strong> or the <strong>IST token doesn't have the right permissions</strong>.
          </p>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Quick Fix:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Verify Site ID in Wix Dashboard → Settings → Advanced → Developer Tools</li>
              <li>Check IST token has "Data Collections" permissions</li>
              <li>Ensure IST token was created for the correct site</li>
              <li>See <code className="bg-blue-100 px-1 rounded">FIX_API_CONNECTION.md</code> for detailed steps</li>
            </ol>
          </div>
        </div>
        <div className="mb-6 flex gap-4 flex-wrap">
          <a 
            href="/api/test-ist-token" 
            target="_blank"
            className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            🔑 Test IST Token
          </a>
          <a 
            href="/api/verify-site-id" 
            target="_blank"
            className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            ✅ Verify Site ID
          </a>
        </div>

        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-blue-800">Testing Wix API connection...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {status && (
          <div className="space-y-6">
            {/* Environment Variables Check */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold mb-4">Environment Variables</h2>
              <div className="space-y-2 font-mono text-sm">
                <div>
                  <span className="font-bold">WIX_CLIENT_ID:</span>{' '}
                  <span className={status.env?.hasClientId ? 'text-green-600' : 'text-red-600'}>
                    {status.env?.hasClientId ? '✓ Set' : '✗ Missing'}
                  </span>
                </div>
                <div>
                  <span className="font-bold">WIX_ACCOUNT_ID:</span>{' '}
                  <span className={status.env?.hasAccountId ? 'text-green-600' : 'text-red-600'}>
                    {status.env?.hasAccountId ? '✓ Set' : '✗ Missing'}
                  </span>
                </div>
                <div>
                  <span className="font-bold">WIX_SITE_ID:</span>{' '}
                  <span className={status.env?.hasSiteId ? 'text-green-600' : 'text-red-600'}>
                    {status.env?.hasSiteId ? `✓ Set (${status.env.siteId?.substring(0, 20)}...)` : '✗ Missing - This is required!'}
                  </span>
                  {!status.env?.hasSiteId && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      <p className="font-semibold text-yellow-800">How to get your Site ID:</p>
                      <ol className="list-decimal list-inside mt-1 text-yellow-700 space-y-1">
                        <li>Go to <a href="https://www.wix.com/my-account/site-selector" target="_blank" rel="noopener noreferrer" className="underline">Wix Dashboard</a></li>
                        <li>Select your site</li>
                        <li>Go to Settings → Advanced → Developer Tools</li>
                        <li>Copy your Site ID</li>
                        <li>Add it to .env.local as NEXT_PUBLIC_WIX_SITE_ID</li>
                        <li>Restart your dev server</li>
                      </ol>
                    </div>
                  )}
                </div>
                <div>
                  <span className="font-bold">WIX_API_KEY:</span>{' '}
                  <span className={status.env?.hasApiKey ? 'text-green-600' : 'text-red-600'}>
                    {status.env?.hasApiKey ? `✓ Set (${status.env.apiKey?.substring(0, 20)}...)` : '✗ Missing'}
                  </span>
                </div>
              </div>
            </div>

            {/* API Response */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold mb-4">API Response</h2>
              {status.apiResponse ? (
                <div>
                  <div className="mb-4">
                    <span className="font-semibold">Status:</span>{' '}
                    <span className={status.apiResponse.success ? 'text-green-600' : 'text-red-600'}>
                      {status.apiResponse.success ? '✓ Success' : '✗ Failed'}
                    </span>
                  </div>
                  {status.apiResponse.statusCode && (
                    <div className="mb-4">
                      <span className="font-semibold">HTTP Status:</span>{' '}
                      <span className={status.apiResponse.statusCode === 200 ? 'text-green-600' : 'text-red-600'}>
                        {status.apiResponse.statusCode}
                      </span>
                    </div>
                  )}
                  {status.apiResponse.error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded p-4">
                      <span className="font-semibold text-red-800">Error:</span>
                      <pre className="mt-2 text-sm text-red-600 whitespace-pre-wrap">
                        {JSON.stringify(status.apiResponse.error, null, 2)}
                      </pre>
                    </div>
                  )}
                  {status.apiResponse.data && (
                    <div className="mb-4">
                      <span className="font-semibold">Items Found:</span>{' '}
                      <span className="text-blue-600 font-bold">
                        {status.apiResponse.data.items?.length || 0}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No API response yet</p>
              )}
            </div>

            {/* Raw Data */}
            {status.apiResponse?.data && status.apiResponse.data.items && status.apiResponse.data.items.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-4">Hats Found ({status.apiResponse.data.items.length})</h2>
                <div className="space-y-4">
                  {status.apiResponse.data.items.slice(0, 5).map((hat: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded p-4">
                      <div className="font-semibold text-lg">{hat.title || hat.name || 'Untitled'}</div>
                      {hat.hatSubtitle && <div className="text-gray-600 text-sm">{hat.hatSubtitle}</div>}
                      {hat.price && <div className="text-blue-600 font-bold">€{hat.price}</div>}
                      <div className="mt-2 text-xs text-gray-400">
                        ID: {hat._id || 'No ID'}
                      </div>
                    </div>
                  ))}
                  {status.apiResponse.data.items.length > 5 && (
                    <p className="text-gray-500 text-sm">
                      ... and {status.apiResponse.data.items.length - 5} more items
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* All Collections List */}
            {status.allCollections && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-4">All Available Collections</h2>
                {(() => {
                  // Handle different response structures from Wix API
                  let collectionsArray: any[] = [];
                  
                  if (Array.isArray(status.allCollections.collections)) {
                    collectionsArray = status.allCollections.collections;
                  } else if (Array.isArray(status.allCollections)) {
                    collectionsArray = status.allCollections;
                  } else if (status.allCollections.collections?.collections && Array.isArray(status.allCollections.collections.collections)) {
                    collectionsArray = status.allCollections.collections.collections;
                  } else if (status.allCollections.data?.collections && Array.isArray(status.allCollections.data.collections)) {
                    collectionsArray = status.allCollections.data.collections;
                  } else if (status.allCollections.collections?.items && Array.isArray(status.allCollections.collections.items)) {
                    collectionsArray = status.allCollections.collections.items;
                  }
                  
                  if (collectionsArray.length > 0) {
                    return (
                      <div className="space-y-2">
                        {collectionsArray.map((col: any, idx: number) => (
                          <div key={idx} className="border border-gray-200 rounded p-3">
                            <div className="font-semibold">{col.name || col.displayName || col._id || 'Unnamed Collection'}</div>
                            {col._id && <div className="text-xs text-gray-500">ID: {col._id}</div>}
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    return (
                      <div>
                        <p className="text-gray-500 mb-4">No collections array found in response. Raw response:</p>
                        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                          {JSON.stringify(status.allCollections, null, 2)}
                        </pre>
                      </div>
                    );
                  }
                })()}
              </div>
            )}

            {/* Collection Name Used */}
            {status.apiResponse?.collectionName && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-green-800 mb-2">
                  ✓ Found Collection!
                </h2>
                <p className="text-green-700">
                  Working collection name: <strong>{status.apiResponse.collectionName}</strong>
                </p>
              </div>
            )}

            {/* Connection Test Results */}
            {status.connectionTest && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-4">Connection Test Results</h2>
                <div className="space-y-4">
                  {status.connectionTest.tests?.map((test: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded p-4">
                      <div className="font-semibold mb-2">{test.test}</div>
                      {test.url && (
                        <div className="text-xs text-gray-500 mb-2">URL: {test.url}</div>
                      )}
                      <div className="mb-2">
                        <span className="font-semibold">Status: </span>
                        <span className={test.success ? 'text-green-600' : 'text-red-600'}>
                          {test.status} {test.statusText || ''}
                        </span>
                      </div>
                      {test.error && (
                        <div className="text-red-600 text-sm mb-2">Error: {test.error}</div>
                      )}
                      {test.response && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-blue-600">View Response</summary>
                          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-48 mt-2">
                            {JSON.stringify(test.response, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw JSON */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold mb-4">Raw Response</h2>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(status, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
