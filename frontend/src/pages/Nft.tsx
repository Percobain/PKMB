import { useState, useRef, ChangeEvent } from 'react'
import { ethers } from 'ethers'
import { Navbar } from '@/components/Navbar'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Loader2, Upload, Twitter, Info, Share2, LinkIcon } from 'lucide-react'
import { useMetaMask } from '@/hooks/useMetamask'
import { pkmb721Abi } from '@/abis/pkmb721Abi'
import { erc20Abi } from '@/abis/erc20Abi'
import {
  uploadFileToIPFS,
  uploadMetadataToIPFS,
  resolveIPFSUrl,
} from '@/utils/uploadToIpfs'
import {
  normalModeProcessing,
  savageModeProcessing,
} from '@/utils/imageProcessing'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface MintedShareableData {
  imageGatewayUrl: string
  metadataCid: string
  nftName: string
}

export function Nft() {
  const { isConnected, account, connect } = useMetaMask()

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [nftName, setNftName] = useState('')
  const [nftDescription, setNftDescription] = useState('')
  const [processingMode, setProcessingMode] = useState<'normal' | 'desi'>(
    'normal'
  )

  const [activeTab, setActiveTab] = useState('upload')
  const [isLoading, setIsLoading] = useState(false)
  const [mintingStep, setMintingStep] = useState<
    'editing' | 'preview' | 'minting' | 'success'
  >('editing')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [tokenId, setTokenId] = useState<string | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)

  const [mintedShareData, setMintedShareData] =
    useState<MintedShareableData | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const nftContractAddress =
    import.meta.env.VITE_PKMB721 || '0xE29529177242ac1C4D4C7E1c6F4Eb2eab575b955'
  const tokenContractAddress =
    import.meta.env.VITE_PKMBToken ||
    '0xEf89f9724d93b3fF5Ef65E9c8E630EA95b5E5643'

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setUploadedFile(file)

      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreviewImage(event.target.result as string)
          setProcessedImage(null)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items;
    
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setUploadedFile(file);
          
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              setPreviewImage(e.target.result as string);
              setProcessedImage(null);
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  const processImage = async () => {
    if (!previewImage) return

    setIsLoading(true)
    try {
      let processedBlob

      if (processingMode === 'normal') {
        processedBlob = await normalModeProcessing(previewImage)
      } else {
        processedBlob = await savageModeProcessing(previewImage)
      }

      const processedUrl = URL.createObjectURL(processedBlob)
      setProcessedImage(processedUrl)

      setUploadedFile(
        new File([processedBlob], uploadedFile?.name || 'processed_image.jpg', {
          type: 'image/jpeg',
        })
      )

      setMintingStep('preview')
    } catch (error) {
      console.error('Error processing image:', error)
      toast.error('Failed to process image')
    } finally {
      setIsLoading(false)
    }
  }

  const mintNFT = async () => {
    if (!isConnected) {
      await connect()
      return
    }

    if (!uploadedFile || !processedImage || !nftName) {
      toast.error('Please complete all required fields')
      return
    }

    setIsLoading(true)
    setMintingStep('minting')
    setMintedShareData(null)

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not detected')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      const imageUploadResult = await uploadFileToIPFS(uploadedFile)

      const metadata = {
        name: nftName,
        description: nftDescription || `${nftName} - An NFT with Indian pride`,
        image: imageUploadResult.url,
        attributes: [
          { trait_type: 'Creator', value: account },
          {
            trait_type: 'Style',
            value: processingMode === 'normal' ? 'Normal Mode' : 'Desi Mode',
          },
          { trait_type: 'Flag', value: 'India' },
        ],
      }

      const metadataUploadResult = await uploadMetadataToIPFS(metadata)

      setMintedShareData({
        imageGatewayUrl: resolveIPFSUrl(imageUploadResult.url),
        metadataCid: metadataUploadResult.cid,
        nftName: nftName,
      })

      const nftContract = new ethers.Contract(
        nftContractAddress,
        pkmb721Abi,
        signer
      )

      const tokenContract = new ethers.Contract(
        tokenContractAddress,
        erc20Abi,
        signer
      )

      const mintPrice = await nftContract.mintPrice()

      const currentAllowance = await tokenContract.allowance(
        account,
        nftContractAddress
      )

      if (currentAllowance < mintPrice) {
        const approveTx = await tokenContract.approve(
          nftContractAddress,
          mintPrice
        )
        await approveTx.wait()
        toast.success('Approved PKMB token spending')
      }

      const mintTx = await nftContract.mintNFT(
        account,
        metadataUploadResult.url
      )
      setTxHash(mintTx.hash)

      const receipt = await mintTx.wait()

      const nftMintedEvent = receipt.logs
        .filter((log: any) => log.fragment?.name === 'NFTMinted')
        .map((log: any) => nftContract.interface.parseLog(log))
        .find(Boolean)

      if (nftMintedEvent) {
        const mintedTokenId = nftMintedEvent.args.tokenId.toString()
        setTokenId(mintedTokenId)
      }

      setMintingStep('success')
      toast.success('NFT minted successfully!')
    } catch (error: any) {
      console.error('Error minting NFT:', error)
      setMintingStep('preview')

      let errorMsg = 'Failed to mint NFT'
      if (error.message) {
        if (error.message.includes('insufficient funds')) {
          errorMsg =
            'Insufficient PKMB tokens. Please get more from the faucet.'
        } else if (error.message.includes('user rejected')) {
          errorMsg = 'Transaction rejected by user'
        } else if (error.message.includes('Network Error')) {
          errorMsg = 'Network error. Please check your internet connection.'
        } else if (error.message.includes('Failed to upload')) {
          errorMsg = 'Failed to upload to IPFS. Please try again.'
        }
      }
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const getShareableLink = () => {
    if (!mintedShareData) return ''
    return `${window.location.origin}/view-nft?cid=${mintedShareData.metadataCid}`
  }

  const shareOnTwitter = () => {
    if (!mintedShareData) {
      toast.error(
        'NFT data not available for sharing. Please wait for minting to complete.'
      )
      return
    }

    const nftViewerPageUrl = getShareableLink()
    if (!nftViewerPageUrl) return

    const tweetText = encodeURIComponent(
      `Just minted my Indian Pride NFT "${mintedShareData.nftName}" with @pkmb_token! Check it out: ${nftViewerPageUrl} #PKMB #NFT #India`
    )
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank')
    setShowShareDialog(false)
  }

  const copyShareLink = () => {
    if (!mintedShareData) {
      toast.error('NFT data not available for copying link.')
      return
    }
    const link = getShareableLink()
    if (!link) return

    navigator.clipboard
      .writeText(link)
      .then(() => {
        toast.success('Link copied to clipboard!')
      })
      .catch((err) => {
        console.error('Failed to copy link: ', err)
        toast.error('Failed to copy link.')
      })
    setShowShareDialog(false)
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <AuroraBackground animate={true} speed={2} className="fixed inset-0 -z-10" />
      
      <div className="container mx-auto px-4 py-8 pt-24 relative z-10 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          {mintingStep === 'editing' && (
            <Card className="bg-background/80 backdrop-blur-sm border-2 shadow-xl mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Choose Your Image Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  defaultValue={activeTab}
                  onValueChange={(value) => setActiveTab(value)}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-1 mb-4">
                    <TabsTrigger value="upload">Upload Image</TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-4">
                    <div 
                      className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center"
                      onPaste={handlePaste}
                      tabIndex={0}
                    >
                      {previewImage ? (
                        <div className="w-full">
                          <img
                            src={previewImage}
                            alt="Preview"
                            className="max-h-64 mx-auto object-contain rounded-lg"
                          />
                          <Button
                            variant="outline"
                            className="mt-4 w-full"
                            onClick={() => {
                              setPreviewImage(null)
                              setUploadedFile(null)
                            }}
                          >
                            Remove Image
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground mb-1">
                            Click to upload your image (JPG, PNG)
                          </p>
                          <p className="text-xs text-muted-foreground mb-4">
                            Or paste from clipboard (Ctrl+V)
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Select Image
                          </Button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/png, image/jpeg"
                            onChange={handleFileUpload}
                          />
                        </>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator className="my-6" />

                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      NFT Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="My Indian Pride NFT"
                      value={nftName}
                      onChange={(e) => setNftName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Description (optional)
                    </Label>
                    <Input
                      id="description"
                      placeholder="A description of your NFT"
                      value={nftDescription}
                      onChange={(e) => setNftDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label>Processing Mode</Label>
                    <RadioGroup
                      value={processingMode}
                      onValueChange={(value) =>
                        setProcessingMode(value as 'normal' | 'desi')
                      }
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="normal" id="normal" />
                        <Label htmlFor="normal">Normal Mode</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="savage" id="savage" />
                        <Label htmlFor="savage">Desi Mode</Label>
                      </div>
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground mt-2">
                      {processingMode === 'normal'
                        ? 'Normal Mode is your badge of being a true Hindustani.'
                        : 'Desi mode shows them who the real daddy is.'}
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  disabled={!previewImage || !nftName || isLoading}
                  onClick={processImage}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : processingMode === 'normal' ? (
                    'Preview with Indian Flag'
                  ) : (
                    'Preview in Desi Mode'
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

          {mintingStep === 'preview' && (
            <Card className="bg-background/80 backdrop-blur-sm border-2 shadow-xl mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Preview Your NFT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-6">
                  <div className="border rounded-lg p-4 w-full max-w-md">
                    {processedImage && (
                      <img
                        src={processedImage}
                        alt="NFT Preview"
                        className="w-full object-contain rounded-lg"
                      />
                    )}
                  </div>

                  <div className="space-y-3 w-full">
                    <div>
                      <Label className="text-sm opacity-70">Name</Label>
                      <div className="text-lg font-bold">{nftName}</div>
                    </div>

                    {nftDescription && (
                      <div>
                        <Label className="text-sm opacity-70">
                          Description
                        </Label>
                        <div>{nftDescription}</div>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm opacity-70">Style</Label>
                      <div className="font-medium">
                        {processingMode === 'normal'
                          ? 'Normal Mode'
                          : 'Desi Mode'}
                      </div>
                    </div>

                    <div className="bg-primary/10 p-3 rounded-md flex items-start space-x-3">
                      <Info size={18} className="text-primary mt-0.5" />
                      <div>
                        <p className="text-sm">
                          Minting will cost{' '}
                          <span className="font-bold">10 PKMB</span> tokens.
                          Make sure you have enough tokens in your wallet.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="sm:flex-1"
                  onClick={() => setMintingStep('editing')}
                >
                  Go Back
                </Button>
                <Button
                  className="sm:flex-1"
                  disabled={isLoading}
                  onClick={mintNFT}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Minting...
                    </>
                  ) : (
                    'Mint NFT'
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

          {mintingStep === 'minting' && (
            <Card className="bg-background/80 backdrop-blur-sm border-2 shadow-xl mb-8">
              <CardHeader>
                <CardTitle className="text-center">
                  Minting Your NFT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  <h3 className="text-xl font-medium mt-4">
                    Transaction in Progress
                  </h3>
                  <p className="text-muted-foreground">
                    Please wait while your NFT is being minted...
                  </p>

                  {txHash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:text-blue-600 underline"
                    >
                      View transaction on Etherscan
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {mintingStep === 'success' && (
            <Card className="bg-background/80 backdrop-blur-sm border-2 shadow-xl mb-8">
              <CardHeader>
                <CardTitle className="text-center text-green-500">
                  NFT Minted Successfully!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center p-4 text-center space-y-6">
                  {(mintedShareData?.imageGatewayUrl || processedImage) && (
                    <div className="border rounded-lg p-4 max-w-md">
                      <img
                        src={
                          mintedShareData?.imageGatewayUrl || processedImage!
                        }
                        alt="Minted NFT"
                        className="max-h-64 mx-auto object-contain rounded-lg"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-xl font-medium">
                      {mintedShareData?.nftName || nftName}
                    </h3>
                    {nftDescription && (
                      <p className="text-muted-foreground">
                        {nftDescription}
                      </p>
                    )}

                    <p className="text-sm">
                      Token ID: <span className="font-mono">{tokenId}</span>
                    </p>

                    <p className="text-sm">
                      Style:{' '}
                      <span className="font-medium">
                        {processingMode === 'normal'
                          ? 'Normal Mode'
                          : 'Desi Mode'}
                      </span>
                    </p>

                    {txHash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-500 hover:text-blue-600 underline"
                      >
                        View transaction on Etherscan
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="sm:flex-1"
                  onClick={() => {
                    setNftName('')
                    setNftDescription('')
                    setPreviewImage(null)
                    setPreviewImage(null)
                    setProcessedImage(null)
                    setUploadedFile(null)
                    setProcessingMode('normal')
                    setMintingStep('editing')
                    setTxHash(null)
                    setMintedShareData(null)
                  }}
                >
                  Create Another NFT
                </Button>
                <Button
                  className="sm:flex-1"
                  onClick={() => setShowShareDialog(true)}
                  disabled={!mintedShareData}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share NFT
                </Button>
              </CardFooter>
            </Card>
          )}
        </motion.div>
      </div>

      <AlertDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share Your NFT</AlertDialogTitle>
            <AlertDialogDescription>
              Share your "{mintedShareData?.nftName || 'Indian Pride NFT'}" with
              your friends!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center my-4">
            {(mintedShareData?.imageGatewayUrl || processedImage) && (
              <img
                src={mintedShareData?.imageGatewayUrl || processedImage!}
                alt={mintedShareData?.nftName || 'NFT Preview'}
                className="max-h-48 object-contain rounded-lg"
              />
            )}
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={copyShareLink}
              className="w-full sm:w-auto"
            >
              <LinkIcon className="mr-2 h-4 w-4" /> Copy Link
            </Button>
            <AlertDialogAction
              onClick={shareOnTwitter}
              className="w-full sm:w-auto"
            >
              <Twitter className="mr-2 h-4 w-4" />
              Share on Twitter
            </AlertDialogAction>
            <AlertDialogCancel className="w-full sm:w-auto mt-2 sm:mt-0">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}