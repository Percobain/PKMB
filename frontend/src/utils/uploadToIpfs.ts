import axios from 'axios';

export interface IPFSResponse {
  cid: string;
  url: string;
}

// Read Pinata API keys from environment variables
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const MY_PINATA_GATEWAY = import.meta.env.VITE_MY_PINATA_GATEWAY;

/**
 * Uploads a file to IPFS using Pinata
 * @param file The file to upload
 * @returns A promise that resolves to an IPFS response with CID and URL
 */
export async function uploadFileToIPFS(file: File): Promise<IPFSResponse> {
  try {
    // Create form data with the file
    const formData = new FormData();
    formData.append('file', file);
    
    // Optional metadata for the file
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        app: 'PKMB',
        type: 'NFT image'
      }
    });
    formData.append('pinataMetadata', metadata);
    
    // Optional pinning options
    const pinataOptions = JSON.stringify({
      cidVersion: 1 // Using CIDv1 is generally recommended
    });
    formData.append('pinataOptions', pinataOptions);
    
    // Make request to Pinata API
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    // Extract CID from response
    const cid = response.data.IpfsHash;
    console.log('[uploadFileToIPFS] Pinata IpfsHash:', cid, 'Length:', cid.length);
    
    if (!cid || (cid.startsWith('Qm') && cid.length !== 46) && (!cid.startsWith('b') || cid.length < 50)) {
        console.error('[uploadFileToIPFS] Pinata returned an invalid or unexpected CID format:', cid);
        throw new Error(`Pinata returned an invalid CID for file: ${cid}`);
    }

    return {
      cid,
      url: `ipfs://${cid}`
    };
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw new Error('Failed to upload file to IPFS: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Uploads metadata to IPFS using Pinata
 * @param metadata The metadata to upload
 * @returns A promise that resolves to an IPFS response with CID and URL
 */
export async function uploadMetadataToIPFS(metadata: any): Promise<IPFSResponse> {
  try {
    // Prepare the pinata metadata
    const pinataInternalMetadata = {
      name: metadata.name ? `${metadata.name} Metadata` : 'NFT Metadata',
      keyvalues: {
        app: 'PKMB',
        type: 'NFT metadata'
      }
    };

    const pinataOptions = {
      cidVersion: 1
    };
    
    // Make request to Pinata API
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        pinataMetadata: pinataInternalMetadata, // Use the renamed variable
        pinataContent: metadata, // Pinata expects the content directly under pinataContent for JSON
        pinataOptions: pinataOptions // Add pinataOptions here
      },
      {
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract CID from response
    const cid = response.data.IpfsHash;
    console.log('[uploadMetadataToIPFS] Pinata IpfsHash:', cid, 'Length:', cid.length);

    // Updated validation to expect CIDv1 (starts with 'b')
    if (!cid || !cid.startsWith('b') || !(cid.length >= 50 && cid.length <= 65)) {
        console.error('[uploadMetadataToIPFS] Pinata returned an invalid or unexpected CIDv1 format:', cid, "Full response:", response.data);
        throw new Error(`Pinata returned an invalid CIDv1 for metadata: ${cid}`);
    }
    
    return {
      cid,
      url: `ipfs://${cid}`
    };
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error);
    throw new Error('Failed to upload metadata to IPFS: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Resolves an IPFS URL to HTTP URL for browser display
 * @param ipfsUrl The IPFS URL (ipfs://...)
 * @returns HTTP URL to display the content
 */
export function resolveIPFSUrl(ipfsUrl: string): string {
  if (!ipfsUrl) return '';
  
  let cid = '';
  if (ipfsUrl.startsWith('ipfs://')) {
    cid = ipfsUrl.replace('ipfs://', '');
  } else if ((ipfsUrl.startsWith('Qm') && ipfsUrl.length === 46) || (ipfsUrl.startsWith('b') && ipfsUrl.length > 50)) {
    // Assume it's a raw CID
    cid = ipfsUrl;
  } else if (ipfsUrl.startsWith('http')) {
    // It's already an HTTP URL, return it directly
    return ipfsUrl;
  } else {
    console.warn('resolveIPFSUrl: Unrecognized IPFS URL format:', ipfsUrl);
    return ''; // Or return a placeholder/error URL
  }

  if (!cid) {
    console.warn('resolveIPFSUrl: Could not extract CID from:', ipfsUrl);
    return '';
  }
  
  // Use your dedicated Pinata gateway
  return `https://${MY_PINATA_GATEWAY}/ipfs/${cid}`;
}

/**
 * Test if the Pinata API connection is working
 * @returns Promise<boolean> True if connection is successful
 */
export async function testPinataConnection(): Promise<boolean> {
  try {
    const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Pinata API connection test failed:', error);
    return false;
  }
}

// It's still good to have a basic isValidCID function for internal checks or debugging
export function isValidCID(cid: string): boolean {
  if (!cid || typeof cid !== 'string') return false;
  if (cid.startsWith('Qm')) {
    return cid.length === 46;
  }
  if (cid.startsWith('b')) {
    return cid.length >= 50 && cid.length <= 65; // Typical length for CIDv1
  }
  return false;
}
