import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Navbar } from '@/components/Navbar'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Loader2, Share2, LinkIcon, Trash2, SendHorizontal } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  const [isActionLoading, setIsActionLoading] = useState(false)
  const navigate = useNavigate()
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showBurnDialog, setShowBurnDialog] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [transferAddress, setTransferAddress] = useState('')
  const [isValidAddress, setIsValidAddress] = useState(false)

  const nftContractAddress =
    import.meta.env.VITE_PKMB721 || '0x61f5CBf29cf93f6cA7A86B89Cb55927eda80eE7C'

  useEffect(() => {
    if (isConnected && account) {
      fetchUserNFTs()
    }
  }, [isConnected, account, nftContractAddress])

  // Validate Ethereum address
  useEffect(() => {
    try {
      setIsValidAddress(ethers.isAddress(transferAddress))
    } catch (e) {
      setIsValidAddress(false)
    }
  }, [transferAddress])

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
      `Check out my Indian Pride NFT "${selectedNft.name}" minted $PKMB! ✨ Created by @shreyanstatiya & @Amandeeep02 - View it here: ${nftViewerPageUrl} #PKMB #NFT #India #WEB3` 
    )
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank')
    setShowShareDialog(false)
  }

  // Burn NFT functionality
  const burnNFT = async () => {
    if (!selectedNft || !account || !isConnected) {
      toast.error('Please select an NFT to burn')
      return
    }

    setIsActionLoading(true)
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not detected')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const nftContract = new ethers.Contract(
        nftContractAddress,
        pkmb721Abi,
        signer
      )

      // Use burnNFT instead of burn, which is the correct function name based on the ABI
      const tx = await nftContract.burnNFT(selectedNft.id)
      toast.success('Burning NFT...', {
        description: 'Transaction submitted. Please wait for confirmation.'
      })

      await tx.wait()
      
      // Remove the burned NFT from state
      setNfts(currentNfts => 
        currentNfts.filter(nft => nft.id !== selectedNft.id)
      )
      
      toast.success('NFT burned successfully', {
        description: `${selectedNft.name} has been permanently destroyed.`
      })
      setShowBurnDialog(false)
    } catch (error: any) {
      console.error('Error burning NFT:', error)
      let errorMessage = 'Failed to burn NFT'
      
      if (error.message) {
        if (error.message.includes('user rejected transaction')) {
          errorMessage = 'Transaction was rejected'
        }
      }
      
      toast.error(errorMessage, {
        description: 'Please try again or contact support.'
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  // Transfer NFT functionality
  const transferNFT = async () => {
    if (!selectedNft || !account || !isConnected || !isValidAddress) {
      toast.error('Please enter a valid Ethereum address')
      return
    }

    setIsActionLoading(true)
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not detected')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const nftContract = new ethers.Contract(
        nftContractAddress,
        pkmb721Abi,
        signer
      )

      // Use the ERC-721 safeTransferFrom function
      const tx = await nftContract['safeTransferFrom(address,address,uint256)'](
        account,
        transferAddress,
        selectedNft.id
      )
      
      toast.success('Transferring NFT...', {
        description: 'Transaction submitted. Please wait for confirmation.'
      })

      await tx.wait()
      
      // Remove the transferred NFT from state
      setNfts(currentNfts => 
        currentNfts.filter(nft => nft.id !== selectedNft.id)
      )
      
      toast.success('NFT transferred successfully', {
        description: `${selectedNft.name} has been transferred to ${transferAddress.slice(0, 6)}...${transferAddress.slice(-4)}`
      })
      setShowTransferDialog(false)
      setTransferAddress('')
    } catch (error: any) {
      console.error('Error transferring NFT:', error)
      let errorMessage = 'Failed to transfer NFT'
      
      if (error.message) {
        if (error.message.includes('user rejected transaction')) {
          errorMessage = 'Transaction was rejected'
        }
      }
      
      toast.error(errorMessage, {
        description: 'Please try again or contact support.'
      })
    } finally {
      setIsActionLoading(false)
    }
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
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
                    <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-center"
                          onClick={() => {
                            setSelectedNft(nft)
                            setShowShareDialog(true)
                          }}
                          disabled={!nft.metadataCid}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-center"
                          onClick={() => {
                            setSelectedNft(nft)
                            setShowTransferDialog(true)
                          }}
                        >
                          <SendHorizontal className="h-4 w-4 mr-2" />
                          Transfer
                        </Button>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full justify-center"
                        onClick={() => {
                          setSelectedNft(nft)
                          setShowBurnDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Burn
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Share Dialog */}
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
                      <Button variant="outline" onClick={copyShareLinkForSelected} className="flex-1 sm:flex-none">
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Copy Link
                      </Button>
                      <Button variant="outline" onClick={shareOnTwitter} className="flex-1 sm:flex-none">
                        <img 
                          src="/twitter.svg" 
                          alt="Twitter" 
                          className="h-4 w-4 mr-2" 
                        />
                        Share on Twitter
                      </Button>
                      <AlertDialogCancel asChild>
                        <Button variant="ghost" className="flex-1 sm:flex-none">Cancel</Button>
                      </AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
          
                {/* Burn Confirmation Dialog */}
                <AlertDialog open={showBurnDialog} onOpenChange={setShowBurnDialog}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to burn this NFT?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will permanently destroy "{selectedNft?.name || 'this NFT'}" and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={burnNFT} disabled={isActionLoading} className="bg-destructive hover:bg-destructive/90">
                        {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Burn NFT
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
          
                {/* Transfer Dialog */}
                <AlertDialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Transfer NFT</AlertDialogTitle>
                      <AlertDialogDescription>
                        Transfer "{selectedNft?.name || 'this NFT'}" to another address. Ensure the address is correct.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="transfer-address" className="text-right">
                          Recipient
                        </Label>
                        <Input
                          id="transfer-address"
                          value={transferAddress}
                          onChange={(e) => setTransferAddress(e.target.value)}
                          className="col-span-3"
                          placeholder="0x..."
                        />
                      </div>
                      {!isValidAddress && transferAddress.length > 0 && (
                        <p className="col-span-4 text-sm text-destructive text-center -mt-2">
                          Please enter a valid Ethereum address.
                        </p>
                      )}
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={transferNFT} disabled={!isValidAddress || isActionLoading}>
                        {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SendHorizontal className="mr-2 h-4 w-4" />}
                        Transfer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )
          }