import { Card, CardContent } from './card'
import { motion } from 'framer-motion'

export function RoomSkeleton() {
  return (
    <motion.div
      animate={{
        opacity: [0.6, 0.8, 0.6],
      }}
      transition={{
        repeat: Infinity,
        duration: 2,
        ease: 'easeInOut'
      }}
    >
      <Card className='py-0 overflow-hidden relative'>
        {/* Shimmer overlay effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{
            backgroundSize: '1000px 100%',
          }}
          animate={{
            backgroundPosition: ['1000px 0', '-1000px 0'],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: 'linear'
          }}
        />
        
        <CardContent className='p-3'>
          {/* Mobile Layout */}
          <div className='space-y-3 md:hidden'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='flex size-9 items-center justify-center rounded-lg bg-gray-200 animate-pulse'>
                  <div className='size-4 bg-gray-300 rounded'></div>
                </div>
                <div className='space-y-1'>
                  <div className='h-4 w-16 bg-gray-200 rounded animate-pulse'></div>
                  <div className='h-3 w-12 bg-gray-200 rounded animate-pulse'></div>
                </div>
              </div>
              <div className='h-6 w-16 bg-gray-200 rounded-full animate-pulse'></div>
            </div>

            <div className='grid grid-cols-3 gap-2 text-center text-xs'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='space-y-1'>
                  <div className='h-4 w-6 mx-auto bg-gray-200 rounded animate-pulse'></div>
                  <div className='h-3 w-8 mx-auto bg-gray-200 rounded animate-pulse'></div>
                </div>
              ))}
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex flex-1 items-center gap-2'>
                <div className='h-1.5 flex-1 bg-gray-200 rounded-full animate-pulse'></div>
                <div className='h-3 w-8 bg-gray-200 rounded animate-pulse'></div>
              </div>
              <div className='ml-3 flex gap-1'>
                {[1, 2, 3].map((i) => (
                  <div key={i} className='h-6 w-6 bg-gray-200 rounded animate-pulse'></div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className='hidden items-center gap-3 md:flex'>
            <div className='flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200 animate-pulse'>
              <div className='size-4 bg-gray-300 rounded'></div>
            </div>

            <div className='min-w-0 flex-1'>
              <div className='mb-1 flex items-center gap-2'>
                <div className='h-4 w-20 bg-gray-200 rounded animate-pulse'></div>
                <div className='h-6 w-16 bg-gray-200 rounded-full animate-pulse'></div>
              </div>
              <div className='h-3 w-12 bg-gray-200 rounded animate-pulse'></div>
            </div>

            <div className='hidden items-center gap-4 text-xs lg:flex'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='text-center space-y-1'>
                  <div className='h-4 w-4 mx-auto bg-gray-200 rounded animate-pulse'></div>
                  <div className='h-3 w-8 mx-auto bg-gray-200 rounded animate-pulse'></div>
                </div>
              ))}
            </div>

            <div className='flex min-w-0 items-center gap-2'>
              <div className='h-1.5 w-12 lg:w-16 bg-gray-200 rounded-full animate-pulse'></div>
              <div className='w-6 lg:w-8 h-3 bg-gray-200 rounded animate-pulse'></div>
            </div>

            <div className='flex-shrink-0 flex gap-1'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='h-6 w-6 bg-gray-200 rounded animate-pulse'></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
