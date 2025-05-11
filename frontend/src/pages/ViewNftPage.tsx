import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { resolveIPFSUrl } from '@/utils/uploadToIpfs';

interface NFTMetadata {
  name: string;
  description: string;
  image: string; // This will be an ipfs:// URL
  attributes: { trait_type: string; value: string | number }[];
}

export function ViewNftPage() {
  const [searchParams] = useSearchParams();
  const metadataCid = searchParams.get('cid');
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!metadataCid) {
      setError('No metadata CID provided.');
      setIsLoading(false);
      return;
    }

    const fetchMetadata = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const metadataUrl = resolveIPFSUrl(metadataCid); // Directly use CID with resolveIPFSUrl
        if (!metadataUrl) {
          throw new Error('Could not resolve metadata CID to a fetchable URL.');
        }

        const response = await fetch(metadataUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
        }
        const data: NFTMetadata = await response.json();
        setMetadata(data);

        if (data.image) {
          setImageUrl(resolveIPFSUrl(data.image));
        } else {
          setError('Metadata does not contain an image URL.');
        }
      } catch (e: any) {
        console.error('Error fetching NFT metadata:', e);
        setError(e.message || 'Failed to load NFT details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [metadataCid]);

  // Filter attributes to only show Creator and Style, not Flag
  const filteredAttributes = metadata?.attributes?.filter(
    attr => attr.trait_type === 'Creator' || attr.trait_type === 'Style'
  ) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow relative">
        <AuroraBackground animate={true} speed={1.5} className="fixed inset-0 -z-10" />
        <div className="container mx-auto px-4 py-8 md:py-16 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
          {isLoading && (
            <div className="flex flex-col items-center text-center p-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p>Loading NFT Details...</p>
            </div>
          )}

          {error && !isLoading && (
            <Card className="bg-background/80 backdrop-blur-sm border-2 shadow-xl w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-center text-red-500">Error</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p>{error}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Please check the link or try again later.
                </p>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && metadata && (
            <Card className="bg-background/80 backdrop-blur-sm border-2 shadow-xl w-full max-w-2xl overflow-hidden">
              <CardHeader className="py-4 md:py-6">
                <CardTitle className="text-center text-xl sm:text-2xl md:text-3xl break-words px-2">
                  {metadata.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6 px-4 md:px-6 pb-6">
                {imageUrl ? (
                  <div className="flex justify-center">
                    <img
                      src={imageUrl}
                      alt={metadata.name}
                      className="max-h-[40vh] sm:max-h-[50vh] w-auto max-w-full object-contain rounded-lg border p-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-nft.png';
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground p-8 bg-muted/20 rounded-lg">
                    Image not available.
                  </div>
                )}

                {metadata.description && (
                  <div className="mt-3">
                    <h3 className="font-semibold text-base md:text-lg mb-1">Description</h3>
                    <p className="text-muted-foreground text-sm md:text-base whitespace-pre-wrap">
                      {metadata.description}
                    </p>
                  </div>
                )}

                {filteredAttributes.length > 0 && (
                  <div className="mt-3">
                    <h3 className="font-semibold text-base md:text-lg mb-2">Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredAttributes.map((attr, index) => (
                        <div key={index} className="bg-primary/10 p-3 rounded-md text-sm flex flex-col">
                          <p className="font-medium text-primary truncate">{attr.trait_type}</p>
                          <p className="text-muted-foreground truncate">
                            {attr.trait_type === 'Style' ? 
                              (String(attr.value).toLowerCase().includes('normal') ? 'Indian' : 'Desi') : 
                              String(attr.value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}