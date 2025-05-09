import { motion } from 'framer-motion'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { Navbar } from '@/components/Navbar'

export function Landing() {
  return (
    <>
      <Navbar />
      <AuroraBackground animate={true} speed={4}>
        <motion.div
          initial={{ opacity: 0.0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: 'easeInOut',
          }}
          className="relative flex flex-col gap-4 items-center justify-center px-4"
        >
          <div className="text-3xl md:text-7xl font-bold text-white dark:text-white text-center">
            $PKMB
          </div>
        </motion.div>
      </AuroraBackground>
    </>
  )
}
