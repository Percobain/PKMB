import { motion } from 'framer-motion'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { useEffect } from 'react'
import { Navbar } from '@/components/Navbar'

export function Landing() {
  // Set dark theme on component mount
  useEffect(() => {
    document.documentElement.classList.add('dark')
    // Optional: Remove the class when component unmounts
    return () => {
      // document.documentElement.classList.remove('dark');
    }
  }, [])

  return (
    <>
      <Navbar />
      <AuroraBackground className="dark" animate={true} speed={4}>
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
          <div className="text-3xl md:text-7xl font-bold text-white text-center">
            $PKMB
          </div>
        </motion.div>
      </AuroraBackground>
    </>
  )
}
