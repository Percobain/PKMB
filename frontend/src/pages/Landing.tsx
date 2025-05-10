import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LucideChevronRight, Droplets, PaintBucket } from 'lucide-react'

export function Landing() {
  const navigate = useNavigate()

  return (
    <>
      <Navbar />
      {/* Hero Section with Aurora Background */}
      <AuroraBackground animate={true} speed={4} className="h-screen flex items-center justify-center">
        <div className="container mx-auto max-w-6xl px-4 flex flex-col items-center justify-between h-[90vh]">
          <div className="flex-grow"></div> {/* Spacer to push content down from top */}
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: 'easeInOut',
            }}
            className="flex flex-col items-center text-center gap-6 w-full"
          >
            <div className="relative">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, 0, -2, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
              >
                <div className="font-black text-7xl md:text-9xl tracking-tighter bg-gradient-to-r from-orange-500 via-white to-green-500 text-transparent bg-clip-text">
                  $PKMB
                </div>
              </motion.div>
            </div>

            <motion.h1
              className="text-3xl md:text-5xl font-bold mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <span className="bg-gradient-to-r from-orange-500 via-white to-green-500 text-transparent bg-clip-text">
                Backed by 1.4 billion. Not the IMF.
              </span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              $PKMB is the memecoin that celebrates India’s unity.
              Just a coin from a country that can land on the moon... while others can’t even land a loan.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <Button
                size="lg"
                onClick={() => navigate('/faucet')}
                className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 via-white to-green-500 hover:from-orange-600 hover:via-white hover:to-green-600 text-black font-bold transition-all shadow-lg hover:shadow-xl"
              >
                Get your $PKMB now
                <LucideChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
          
          <div className="flex-grow"></div> {/* Spacer for vertical centering */}

          {/* News Ticker - Marquee Style */}
          <motion.div
            className="relative overflow-hidden w-full py-3 bg-black/30 backdrop-blur-sm rounded-lg border border-white/10 text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0 }}
          >
            <div className="relative overflow-hidden w-full">
              <motion.div
                className="inline-flex whitespace-nowrap"
                initial={{ x: '30%' }}
                animate={{ x: '-100%' }}
                transition={{
                  duration: 60, // Increased duration to 60 seconds (was 40)
                  repeat: Infinity,
                  ease: 'linear',
                  repeatType: 'loop',
                }}
              >
                {[
                  'Owning Pakistan since 1947 🔥',
                  'We launch rockets 🚀, PK launch hashtags #',
                  'Chand pe jhanda aur Jhande pe Chand hone mei farak hota hai',
                  'Every time we sneeze, Pakistan catches a cold 🤧',
                  'Trying to match India with borrowed WiFi and pirated dreams.',
                  'Chand pe jaane ka soch rahe hain, tum abhi tak Kashmir mein phase ho.',
                ].map((item, index) => (
                  <span key={index} className="mx-8">
                    {item}
                  </span>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </AuroraBackground>

      {/* Rest of the page with black background */}
      <div className="bg-black min-h-screen">
        <div className="container mx-auto max-w-6xl px-4 py-16">
          {/* Features Section */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.3,
                },
              },
            }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {/* Faucet Feature */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <Card className="bg-black/30 backdrop-blur-sm border-white/10 hover:border-orange-500/50 transition-all overflow-hidden group h-full">
                <CardContent className="p-8 flex flex-col items-center text-center h-full">
                  <div className="mb-6 p-4 rounded-full bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
                    <Droplets size={40} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-orange-500 transition-colors">
                    🚰 Faucet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Claim $PKMB <br /> while they’re stuck in economic crisis.
                  </p>
                  <div className="mt-auto">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/faucet')}
                      className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                    >
                      Visit Faucet
                      <LucideChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* NFT Feature */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <Card className="bg-black/30 backdrop-blur-sm border-white/10 hover:border-green-500/50 transition-all overflow-hidden group h-full">
                <CardContent className="p-8 flex flex-col items-center text-center h-full">
                  <div className="mb-6 p-4 rounded-full bg-green-500/10 text-green-500 group-hover:scale-110 transition-transform">
                    <PaintBucket size={40} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-green-500 transition-colors">
                    🎨 NFTs
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Build your legacy <br /> Digital mark of India’s strength, forever on-chain.
                  </p>
                  <div className="mt-auto">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/mint')}
                      className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                    >
                      Explore NFTs
                      <LucideChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="my-16 text-center max-w-3xl mx-auto"
          >
            <div className="inline-block mb-4 px-4 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium">
              What is $PKMB?
            </div>
            <h2 className="text-3xl font-bold mb-6">
              A Memecoin with Style & Spice
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              $PKMB is more than just a memecoin — it’s a symbol of India’s unwavering unity and strength. While some nations stumble, Bharat rises. With our community-driven spirit and a touch of humor, we’re reshaping fun in Web3, all while standing tall and proud. Join us in this journey of laughter, memes, and a sprinkle of spice. Together, we’re not just creating a coin; we’re building a legacy. 
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                <div className="text-2xl font-bold text-orange-500">10K+</div>
                <div className="text-sm text-muted-foreground">
                  Community Members
                </div>
              </div>
              <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                <div className="text-2xl font-bold text-white">1M+</div>
                <div className="text-sm text-muted-foreground">
                  Memes Created
                </div>
              </div>
              <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                <div className="text-2xl font-bold text-green-500">100%</div>
                <div className="text-sm text-muted-foreground">Pure Fun</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="border-t border-white/10 py-6 mt-10"
        >
          <div className="container mx-auto text-center text-sm text-muted-foreground">
            <p>Made with spice 🇮🇳 | 100% Satire | Not financial advice</p>
          </div>
        </motion.footer>
      </div>
    </>
  )
}
