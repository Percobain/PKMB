import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LucideChevronRight, Droplets, PaintBucket, Grid } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Landing() {
  const navigate = useNavigate()

  return (
    <>
      <Navbar />
      {/* Hero Section with Aurora Background */}
      <AuroraBackground
        animate={true}
        speed={4}
        className="h-screen flex items-center justify-center"
      >
        <div className="container mx-auto max-w-6xl px-4 flex flex-col items-center justify-between h-[90vh]">
          <div className="flex-grow"></div>{' '}
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
              <motion.div>
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
              $PKMB is the memecoin that celebrates India's unity. Just a coin
              from a country that can land on the moon... while others can't
              even land a loan.
            </motion.p>
          </motion.div>

          <div className="mt-12 mb-12 z-10 relative">
            <Button
              size="lg"
              onClick={() => navigate('/faucet')}
              className="group text-lg px-8 py-6 bg-gradient-to-r from-orange-500 via-white to-green-500 hover:from-orange-600 hover:via-white hover:to-green-600 text-black font-bold transition-all shadow-lg hover:shadow-xl cursor-pointer"
            >
              Get your $PKMB now
              <LucideChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <div className="flex-grow"></div>{' '}
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
                duration: 30,
                repeat: Infinity,
                ease: 'linear',
                repeatType: 'loop',
              }}
              >
              {[
                'Owning Pakistan since 1947 🔥',
                'India talks to ISRO. Pakistan listens to IMF.',
                'India’s GDP hits trillions. Pakistan hits rock bottom.',
                'We hit boundaries. They cross them illegally.',
                'We build tech giants. They build terrorists.',
                'Chand pe Jhanda lagane mein aur Jhande pe Chand lagane mein farak hai.',
                '1947 | 1965 | 1971 | 1999 | 2025'
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

      {/* Dots Background with Features */}
      <div className="relative flex flex-col min-h-screen w-full items-center justify-center bg-white dark:bg-black">
        {/* Dots Background */}
        <div
          className={cn(
            "absolute inset-0",
            "[background-size:20px_20px]",
            "[background-image:radial-gradient(#d4d4d4_1px,transparent_1px)]",
            "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]",
          )}
        />
        {/* Radial gradient for the container to give a faded look */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black"></div>
        
        {/* Content over the dots */}
        <div className="container relative z-10 mx-auto max-w-6xl px-4 py-24">
          {/* Features Section */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
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
            <Card className="bg-black/30 backdrop-blur-sm border-white/10 hover:border-orange-500/50 transition-all overflow-hidden group h-full">
              <CardContent className="p-8 flex flex-col items-center text-center h-full">
                <div className="mb-6 p-4 rounded-full bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
                  <Droplets size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-orange-500 transition-colors">
                  🚰 Faucet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Claim $PKMB <br /> while they're stuck in economic crisis.
                </p>
                <div className="mt-auto">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/faucet')}
                    className="border-orange-500/50 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 hover:border-orange-400 transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                  >
                    Visit Faucet
                    <LucideChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* NFT Mint Feature */}
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
                    🎨 NFT Mint
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Build your legacy <br /> Digital mark of India's strength,
                    forever on-chain.
                  </p>
                  <div className="mt-auto">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/mint')}
                      className="border-green-500/50 text-green-400 hover:bg-green-500/20 hover:text-green-300 hover:border-green-400 transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    >
                      Mint NFTs
                      <LucideChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* NFT Collections Feature */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <Card className="bg-black/30 backdrop-blur-sm border-white/10 hover:border-blue-500/50 transition-all overflow-hidden group h-full">
                <CardContent className="p-8 flex flex-col items-center text-center h-full">
                  <div className="mb-6 p-4 rounded-full bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                    <Grid size={40} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-500 transition-colors">
                    🖼️ NFT Collections
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Browse our gallery <br /> Discover the finest Indian pride
                    digital collectibles.
                  </p>
                  <div className="mt-auto">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/my-nfts')}
                      className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-400 transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    >
                      View Collections
                      <LucideChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
              $PKMB is more than just a memecoin — it's a symbol of India's
              unwavering unity and strength. While some nations stumble, Bharat
              rises. With our community-driven spirit and a touch of humor,
              we're reshaping fun in Web3, all while standing tall and proud.
              Join us in this journey of laughter, memes, and a sprinkle of
              spice. Together, we're not just creating a coin; we're building a
              legacy.
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
          className="relative z-10 w-full border-t border-white/10 py-6 mt-10"
        >
          <div className="container mx-auto text-center text-sm text-muted-foreground">
            <p>
              Made with spice by{" "}
              <a 
                href="https://twitter.com/shreyanstatiya" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="relative inline-block group"
              >
                <span className="hover:text-primary transition-colors">Shreyans</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-green-500 group-hover:w-full transition-all duration-300"></span>
              </a>
              {" & "}
              <a 
                href="https://twitter.com/Amandeeep02" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="relative inline-block group"
              >
                <span className="hover:text-primary transition-colors">Amandeep</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-green-500 group-hover:w-full transition-all duration-300"></span>
              </a>
            </p>
          </div>
        </motion.footer>
      </div>
    </>
  )
}
