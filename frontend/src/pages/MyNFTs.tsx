import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Navbar } from '@/components/Navbar'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Loader2, ExternalLink, Share2, LinkIcon, Twitter } from 'lucide-react'
import { useMetaMask } from '@/hooks/useMetamask'
import { pkmb721Abi } from '@/abis/pkmb721Abi'
import { useNavigate } from 'react-router-dom'
import { resolveIPFSUrl } from '@/utils/uploadToIpfs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface NFT {
  id: string
  name: string
  description: string
  image: string
  attributes: {
    trait_type: string
    value: string
  }[]
  metadataCid: string
  creator?: string
}

export function MyNFTs() {
  const { isConnected, account, connect } = useMetaMask()
  const [nfts, setNfts] = useState<NFT[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)

  const nftContractAddress =
    import.meta.env.VITE_PKMB721 || '0x61f5CBf29cf93f6cA7A86B89Cb55927eda80eE7C'

  useEffect(() => {
    if (isConnected && account) {
      fetchUserNFTs()
    }
  }, [isConnected, account, nftContractAddress])

  const fetchUserNFTs = async () => {
    if (!isConnected || !account) {
      toast.error('Please connect your wallet to view your NFTs')
      return
    }

    setIsLoading(true)
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not detected')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const nftContract = new ethers.Contract(
        nftContractAddress,
        pkmb721Abi,
        provider
      )

      const totalSupplyBigInt = await nftContract.tokenCounter()
      const totalSupply = Number(totalSupplyBigInt)

      if (totalSupply === 0) {
        setNfts([])
        setIsLoading(false)
        return
      }

      const potentialTokenIds = []
      for (let i = 1; i <= totalSupply; i++) {
        potentialTokenIds.push(BigInt(i))
      }

      const ownershipChecks = potentialTokenIds.map(async (tokenIdBigInt) => {
        try {
          const owner = await nftContract.ownerOf(tokenIdBigInt)
          if (owner.toLowerCase() === account.toLowerCase()) {
            return tokenIdBigInt.toString()
          }
          return null
        } catch {
          return null
        }
      })

      const results = await Promise.all(ownershipChecks)
      const ownedTokenIds = results.filter(id => id !== null) as string[]

      if (ownedTokenIds.length === 0) {
        setNfts([])
        setIsLoading(false)
        return
      }

      const nftMetadataPromises = ownedTokenIds.map(async (tokenId) => {
        try {
          const tokenURI = await nftContract.tokenURI(tokenId)

          // Get the creator address (minter) for this token
          let creator = "Unknown"
          try {
            const minter = await nftContract.getMinter(tokenId)
            creator = minter
          } catch (e) {
            console.warn(`Failed to get minter for token ${tokenId}:`, e)
          }

          let currentMetadataCid = ''
          if (tokenURI && tokenURI.startsWith('ipfs://')) {
            currentMetadataCid = tokenURI.substring(7)
          } else if (tokenURI) {
            const parts = tokenURI.split('/')
            currentMetadataCid = parts[parts.length - 1]
            if (!currentMetadataCid.startsWith('baf') && !currentMetadataCid.startsWith('Qm')) {
              console.warn(`Token URI ${tokenURI} for token ${tokenId} is not in expected format. Extracted CID: ${currentMetadataCid}`)
            }
          }

          if (!currentMetadataCid) {
            throw new Error(`Could not extract metadata CID from tokenURI: ${tokenURI}`)
          }

          const resolvedMetadataUrl = resolveIPFSUrl(tokenURI)
          if (!resolvedMetadataUrl) {
            throw new Error(`Could not resolve IPFS URL for tokenURI: ${tokenURI}`)
          }

          const response = await fetch(resolvedMetadataUrl)
          if (!response.ok) {
            throw new Error(`Failed to fetch metadata from ${resolvedMetadataUrl}: ${response.statusText}`)
          }
          const metadata = await response.json()

          return {
            id: tokenId,
            name: metadata.name || `NFT #${tokenId}`,
            description: metadata.description || '',
            image: resolveIPFSUrl(metadata.image) || '',
            attributes: metadata.attributes || [],
            metadataCid: currentMetadataCid,
            creator: creator
          }
        } catch (error) {
          console.error(`Error fetching metadata for token ${tokenId}:`, error)
          return {
            id: tokenId,
            name: `NFT #${tokenId}`,
            description: 'Metadata unavailable',
            image: '',
            attributes: [],
            metadataCid: '',
            creator: 'Unknown'
          }
        }
      })

      const ownedNFTsData = await Promise.all(nftMetadataPromises)
      setNfts(ownedNFTsData.filter(nft => nft !== null) as NFT[])
    } catch (error) {
      console.error('Error fetching NFTs:', error)
      toast.error('Failed to load your NFTs. Check console for details.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectWallet = async () => {
    try {
      await connect()
    } catch (error) {
      console.error('Error connecting wallet:', error)
      toast.error('Failed to connect wallet')
    }
  }

  const getShareableLinkForSelected = () => {
    if (!selectedNft || !selectedNft.metadataCid) return ''
    return `${window.location.origin}/view-nft?cid=${selectedNft.metadataCid}`
  }

  const copyShareLinkForSelected = () => {
    const link = getShareableLinkForSelected()
    if (!link) {
      toast.error('NFT data or metadata CID not available for copying link.')
      return
    }
    navigator.clipboard.writeText(link)
      .then(() => {
        toast.success("Link copied to clipboard!")
      })
      .catch(err => {
        console.error('Failed to copy link: ', err)
        toast.error("Failed to copy link.")
      })
    setShowShareDialog(false)
  }

  const shareOnTwitter = () => {
    if (!selectedNft || !selectedNft.metadataCid) {
      toast.error("NFT data or metadata CID not available for sharing.")
      return
    }

    const nftViewerPageUrl = getShareableLinkForSelected()

    const tweetText = encodeURIComponent(
      `Check out my Indian Pride NFT "${selectedNft.name}" minted with @pkmb_token! View it here: ${nftViewerPageUrl} #PKMB #NFT #India`
    )
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank')
    setShowShareDialog(false)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="relative flex-grow">
        <AuroraBackground animate={true} speed={2} className="fixed inset-0 -z-10" />
        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center mb-8 mt-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-white to-green-500 inline-block text-transparent bg-clip-text">
                My NFT Collection
                </h1>
              <p className="text-muted-foreground mt-2">
                View all your Indian Pride NFTs stored on the blockchain
              </p>
            </div>

            {!isConnected ? (
              <Card className="bg-background/80 backdrop-blur-sm border-2 shadow-xl p-8 text-center">
                <CardContent className="pb-6">
                  <p className="mb-4">Connect your wallet to view your NFT collection</p>
                  <Button onClick={handleConnectWallet}>Connect Wallet</Button>
                </CardContent>
              </Card>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p>Loading your NFT collection...</p>
              </div>
            ) : nfts.length === 0 ? (
              <Card className="bg-background/80 backdrop-blur-sm border-2 shadow-xl p-8 text-center">
                <CardContent className="pb-6">
                  <p className="mb-4">You don't have any NFTs yet</p>
                  <Button onClick={() => navigate('/mint')}>Create Your First NFT</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {nfts.map((nft) => (
                  <Card
                    key={nft.id}
                    className="bg-background/80 backdrop-blur-sm border-2 shadow-xl overflow-hidden hover:shadow-2xl transition-all hover:scale-[1.02] flex flex-col"
                  >
                    <div className="aspect-square bg-muted/20 relative overflow-hidden">
                      {nft.image ? (
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-nft.png'
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Image not available
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 flex-grow">
                      <h3 className="font-bold truncate text-lg">{nft.name}</h3>
                      <p className="text-sm text-muted-foreground truncate h-10">
                        {nft.description || "No description available."}
                      </p>
                      <p className="text-xs mt-2">
                        Token ID: <span className="font-mono">{nft.id}</span>
                      </p>

                      {nft.attributes && nft.attributes.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-muted">
                          <p className="text-xs text-muted-foreground mb-1">Attributes:</p>
                          <div className="flex flex-wrap gap-1">
                            {nft.attributes.slice(0, 3).map((attr, idx) => (
                              <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full truncate">
                                {attr.trait_type}: {attr.value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://sepolia.etherscan.io/token/${nftContractAddress}?a=${nft.id}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Etherscan</span>
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedNft(nft)
                          setShowShareDialog(true)
                        }}
                        disabled={!nft.metadataCid}
                      >
                        <Share2 className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Share</span>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <AlertDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share Your NFT</AlertDialogTitle>
            <AlertDialogDescription>
              Share your "{selectedNft?.name || 'Indian Pride NFT'}" with your friends!
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedNft && (
            <div className="flex justify-center my-4">
              {selectedNft.image ? (
                <img
                  src={selectedNft.image}
                  alt={selectedNft.name}
                  className="max-h-48 object-contain rounded-lg border"
                />
              ) : (
                <div className="max-h-48 w-full bg-muted/30 rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                  Image Preview Unavailable
                </div>
              )}
            </div>
          )}
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={copyShareLinkForSelected} className="w-full sm:w-auto" disabled={!selectedNft?.metadataCid}>
              <LinkIcon className="mr-2 h-4 w-4" /> Copy Link
            </Button>
            <AlertDialogAction onClick={shareOnTwitter} className="w-full sm:w-auto" disabled={!selectedNft?.metadataCid}>
              <Twitter className="mr-2 h-4 w-4" />
              Share on Twitter
            </AlertDialogAction>
            <AlertDialogCancel className="w-full sm:w-auto mt-2 sm:mt-0">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}