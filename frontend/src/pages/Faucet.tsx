import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Navbar } from '@/components/Navbar'
// import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  // ClipboardIcon,
  CopyIcon,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useMetaMask } from '@/hooks/useMetamask'
import { faucetAbi } from '@/abis/faucetAbi'
import { erc20Abi } from '@/abis/erc20Abi'

export function Faucet() {
  const { isConnected, account, connect } = useMetaMask()  
  const [isLoading, setIsLoading] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState<
    'idle' | 'processing' | 'success' | 'error'  >('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [claimDetails, setClaimDetails] = useState({
    amount: '0',
    timeLeft: 0,
    canClaim: false
  })
  const [txHash, setTxHash] = useState<string | null>(null)

  const faucetAddress =
    import.meta.env.VITE_Faucet || '0x8d7404a3D9b90877e4d1464b98b0D49bB3081203'
  const tokenAddress =
    import.meta.env.VITE_PKMBToken ||
    '0xEf89f9724d93b3fF5Ef65E9c8E630EA95b5E5643'

  const fetchFaucetDetails = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const faucetContract = new ethers.Contract(
          faucetAddress,
          faucetAbi,
          provider
        )
        
        // Get token contract from faucet
        const tokenAddress = await faucetContract.pkmbToken()
        
        // Create token contract instance
        const tokenContract = new ethers.Contract(
          tokenAddress,
          erc20Abi,
          provider
        )
        
        // Get claim amount
        const claimAmount = await faucetContract.claimAmount()
        const decimals = await tokenContract.decimals()
        const formattedAmount = ethers.formatUnits(claimAmount, decimals)
        
        // Get token balance of faucet
        const balance = await tokenContract.balanceOf(faucetAddress)
        setRemainingTokens(ethers.formatUnits(balance, decimals))
        
        // Get claim interval and check if user can claim
        if (account) {
          const lastClaimTime = await faucetContract.lastClaimTime(account)
          const claimInterval = await faucetContract.claimInterval()
          const isPaused = await faucetContract.paused()
          
          const currentTime = Math.floor(Date.now() / 1000)
          const nextClaimTime = Number(lastClaimTime) + Number(claimInterval)
          const timeLeft = nextClaimTime - currentTime
          
          const canClaim = timeLeft <= 0 && !isPaused
          
          setClaimDetails({
            amount: formattedAmount,
            timeLeft: Math.max(0, timeLeft),
            canClaim
          })
        }
      }
    } catch (error) {
      console.error('Error fetching faucet details:', error)
    }
  }

  useEffect(() => {
    fetchFaucetDetails()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchFaucetDetails, 30000)
    return () => clearInterval(interval)
  }, [account])

  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return 'Now'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const handleClaim = async () => {
    if (!isConnected) {
      await connect()
      return
    }

    setIsLoading(true)
    setTransactionStatus('processing')
    setErrorMessage('')
    setTxHash(null)

    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()

        const faucetContract = new ethers.Contract(
          faucetAddress,
          faucetAbi,
          signer
        )

        // Using claimTokens from the ABI - this is the correct function
        const tx = await faucetContract.claimTokens()
        setTxHash(tx.hash)
        console.log('Transaction hash:', tx.hash)
        
        // Wait for transaction to be mined
        await tx.wait()

        setTransactionStatus('success')
        toast.success('Tokens claimed successfully!', {
          description: 'PKMB tokens have been sent to your wallet.'
        })

        // Refresh faucet details
        fetchFaucetDetails()
      } else {
        toast.error('MetaMask not detected', {
          description: 'Please install MetaMask to use this feature.'
        })
        setTransactionStatus('error')
        setErrorMessage('MetaMask not detected. Please install MetaMask to use this feature.')
      }
    } catch (error: any) {
      console.error('Error claiming tokens:', error)
      setTransactionStatus('error')
      
      // Extract error message from blockchain error
      let errorMsg = 'Failed to claim tokens. Please try again later.'
      if (error.message) {
        // Check for common faucet errors
        if (error.message.includes('Claim interval not yet passed')) {
          errorMsg = 'Please wait for the claim interval to pass before trying again.'
        } else if (error.message.includes('Faucet is currently paused')) {
          errorMsg = 'The faucet is currently paused.'
        } else if (error.message.includes('Not enough tokens in faucet')) {
          errorMsg = 'The faucet is out of tokens. Please try again later.'
        } else if (error.message.includes('user rejected transaction')) {
          errorMsg = 'Transaction was rejected by the user.'
        }
      }
      
      setErrorMessage(errorMsg)
      toast.error('Failed to claim tokens', {
        description: errorMsg
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyAddress = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Address copied!', {
      description: 'Contract address copied to clipboard'
    })
  }

  return (
    <>
      <Navbar />
      <AuroraBackground animate={true} speed={2}>
        <div className="container mx-auto px-4 pt-20 pb-10 min-h-screen flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Card className="bg-background/80 backdrop-blur-sm border-2 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                  PKMB Faucet
                </CardTitle>
                <CardDescription className="text-center">
                  Claim PKMB tokens for testing purposes
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Token:</span>
                    <span className="font-semibold">$PKMB</span>
                  </div>
                  <div className="flex items-center">
                    <span className="truncate text-xs mr-1 opacity-70">
                      {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyAddress(tokenAddress)}
                    >
                      <CopyIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {claimDetails.amount !== '0' && (
                  <div className="text-sm flex justify-between items-center py-2">
                    <span className="text-muted-foreground">
                      Claim amount:
                    </span>
                    <span className="font-medium">{claimDetails.amount} PKMB</span>
                  </div>
                )}

                {account && claimDetails.timeLeft > 0 && (
                  <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-center">
                    <p className="text-sm text-yellow-500">
                      Next claim available in: {formatTimeLeft(claimDetails.timeLeft)}
                    </p>
                  </div>
                )}

                {!isConnected && (
                  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-center">
                    <p className="text-sm text-blue-500">
                      Connect your wallet to claim tokens
                    </p>
                  </div>
                )}

                {transactionStatus === 'success' && (
                  <Alert className="bg-green-500/10 text-green-500 border-green-500/20">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>Tokens have been sent to your wallet.</p>
                      {txHash && (
                        <div className="text-xs mt-1">
                          <a 
                            href={`https://sepolia.etherscan.io/tx/${txHash}`} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-green-400"
                          >
                            View transaction on Etherscan
                          </a>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {transactionStatus === 'error' && (
                  <Alert className="bg-red-500/10 text-red-500 border-red-500/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {errorMessage}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  onClick={handleClaim}
                  disabled={isLoading || (isConnected && !claimDetails.canClaim)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : !isConnected ? (
                    'Connect Wallet'
                  ) : !claimDetails.canClaim && claimDetails.timeLeft > 0 ? (
                    'Waiting for Cooldown'
                  ) : (
                    'Claim PKMB Tokens'
                  )}
                </Button>
              </CardFooter>
            </Card>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Use this faucet for testnet purposes only.</p>
              <p className="mt-1">One claim per address every {formatTimeLeft(claimDetails.timeLeft > 0 ? claimDetails.timeLeft : 86400)} (default: 24h).</p>
            </div>
          </motion.div>
        </div>
      </AuroraBackground>
    </>
  )
}
