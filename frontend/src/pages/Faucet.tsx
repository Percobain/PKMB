import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Navbar } from '@/components/Navbar'
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
  CopyIcon,
  AlertCircle,
  CheckCircle2,
  Droplets,
  Clock,
  Wallet,
} from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useMetaMask } from '@/hooks/useMetamask'
import { faucetAbi } from '@/abis/faucetAbi'
import { erc20Abi } from '@/abis/erc20Abi'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

export function Faucet() {
  const { isConnected, account, connect } = useMetaMask()  
  const [isLoading, setIsLoading] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState<
    'idle' | 'processing' | 'success' | 'error'  >('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [claimDetails, setClaimDetails] = useState({
    amount: '0',
    timeLeft: 0,
    canClaim: false,
  })
  const [txHash, setTxHash] = useState<string | null>(null)
  const [faucetBalance, setFaucetBalance] = useState<number>(0)

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

        // Get faucet balance
        const balance = await tokenContract.balanceOf(faucetAddress)
        const decimals = await tokenContract.decimals()
        const formattedBalance = parseFloat(ethers.formatUnits(balance, decimals))
        setFaucetBalance(formattedBalance)

        // Get claim amount
        const claimAmount = await faucetContract.claimAmount()
        const formattedAmount = ethers.formatUnits(claimAmount, decimals)

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
            canClaim,
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

  const calculateCooldownProgress = () => {
    if (!claimDetails.timeLeft) return 100

    // Assuming 24h cooldown
    const totalCooldown = 24 * 60 * 60
    const progress =
      ((totalCooldown - claimDetails.timeLeft) / totalCooldown) * 100
    return Math.min(Math.max(progress, 0), 100)
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
          description: 'PKMB tokens have been sent to your wallet.',
        })

        // Refresh faucet details
        fetchFaucetDetails()
      } else {
        toast.error('MetaMask not detected', {
          description: 'Please install MetaMask to use this feature.',
        })
        setTransactionStatus('error')
        setErrorMessage(
          'MetaMask not detected. Please install MetaMask to use this feature.'
        )
      }
    } catch (error: any) {
      console.error('Error claiming tokens:', error)
      setTransactionStatus('error')

      let errorMsg = 'Failed to claim tokens. Please try again later.'
      if (error.message) {
        if (error.message.includes('Claim interval not yet passed')) {
          errorMsg =
            'Please wait for the claim interval to pass before trying again.'
        } else if (error.message.includes('Faucet is currently paused')) {
          errorMsg = 'The faucet is currently paused.'
        } else if (error.message.includes('Not enough tokens in faucet')) {
          errorMsg = 'The faucet is out of tokens. Please try again later.'
        } else if (error.message.includes('user rejected transaction') || error.message.includes('User denied transaction signature') || error.message.includes('user rejected action')) {
          errorMsg = 'Transaction was rejected by the user.'
        }
      }

      setErrorMessage(errorMsg)
      toast.error('Failed to claim tokens', {
        description: errorMsg,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyAddress = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Address copied!', {
      description: 'Contract address copied to clipboard',
    })
  }

  return (
    <>
      <Navbar />
      <AuroraBackground animate={true} speed={2}>
        <div className="container mx-auto px-4 pt-20 pb-16 min-h-screen flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg"
          >
            <div className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-500 via-white to-green-500 inline-block text-transparent bg-clip-text">
                PKMB Faucet
              </h1>
              <p className="text-muted-foreground mt-2">
                Claim free PKMB tokens to begin your journey
              </p>
            </div>

            <Card className="bg-background/80 backdrop-blur-sm border-2 border-white/10 shadow-xl overflow-hidden">
              <CardHeader className="bg-black/40 border-b border-white/5 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-blue-400" />
                      <span>$PKMB Token</span>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Claim {claimDetails.amount} PKMB every 24 hours
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={faucetBalance >= 100 ? "default" : "destructive"}
                    className={faucetBalance >= 100 
                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 flex items-center gap-1.5" 
                      : "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 flex items-center gap-1.5"}
                  >
                    <div 
                      className={faucetBalance >= 100 
                        ? "h-2 w-2 rounded-full bg-green-400 animate-pulse" 
                        : "h-2 w-2 rounded-full bg-red-400 animate-pulse"} 
                    />
                    {faucetBalance >= 100 ? "Active" : "Not Active"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 pt-6">
                <div className="flex items-center justify-between text-sm bg-black/20 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Token Address:
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-mono text-xs mr-2 text-white/70">
                      {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full bg-white/5 hover:bg-white/10"
                      onClick={() => copyAddress(tokenAddress)}
                    >
                      <CopyIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {account && (
                  <div className="rounded-lg bg-black/20 border border-white/5 p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Next claim in:
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {claimDetails.canClaim ? (
                          <span className="text-green-400">Available Now</span>
                        ) : (
                          formatTimeLeft(claimDetails.timeLeft)
                        )}
                      </span>
                    </div>

                    <Progress
                      value={calculateCooldownProgress()}
                      className="h-1.5"
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                      }}
                    />
                  </div>
                )}

                {!isConnected && (
                  <motion.div
                    className="mt-3 p-4 rounded-lg bg-gradient-to-r from-blue-900/30 to-blue-500/30 border border-blue-500/20 text-center"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{
                      repeat: Infinity,
                      repeatType: 'reverse',
                      duration: 2,
                    }}
                  >
                    <p className="text-sm text-blue-400">
                      Connect your wallet to start claiming tokens
                    </p>
                  </motion.div>
                )}

                {transactionStatus === 'success' && (
                  <Alert className="bg-green-500/10 text-green-400 border-green-500/20 rounded-lg">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>
                        {claimDetails.amount} PKMB tokens have been sent to your
                        wallet.
                      </p>
                      {txHash && (
                        <div className="text-xs mt-1">
                          <a
                            href={`https://sepolia.etherscan.io/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-green-300 flex items-center gap-1"
                          >
                            View transaction on Etherscan
                            <svg
                              className="h-3 w-3 inline"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {transactionStatus === 'error' && (
                  <Alert className="bg-red-500/10 text-red-400 border-red-500/20 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter className="border-t border-white/5 pt-4 mt-2 bg-black/20">
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 text-black hover:from-orange-600 hover:via-orange-500 hover:to-orange-600 transition-all duration-300 py-6 font-semibold"
                  onClick={handleClaim}
                  disabled={
                    isLoading || (isConnected && !claimDetails.canClaim)
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Transaction...
                    </>
                  ) : !isConnected ? (
                    'Connect Wallet'
                  ) : !claimDetails.canClaim && claimDetails.timeLeft > 0 ? (
                    'Waiting for Cooldown to End'
                  ) : (
                    `Claim ${claimDetails.amount} PKMB Tokens`
                  )}
                </Button>
              </CardFooter>
            </Card>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>PKMB tokens are for testnet purposes only.</p>
              <p className="mt-1.5">One claim per address every 24 hours.</p>
            </div>
          </motion.div>
        </div>
      </AuroraBackground>
    </>
  )
}
