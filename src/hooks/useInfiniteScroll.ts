import { useCallback, useEffect, useState, useRef } from 'react'

interface UseInfiniteScrollOptions {
  hasMore: boolean
  isLoading: boolean
  threshold?: number
  containerRef?: React.RefObject<HTMLElement>
}

export const useInfiniteScroll = ({
  hasMore,
  isLoading,
  threshold = 200,
  containerRef
}: UseInfiniteScrollOptions) => {
  const [isFetching, setIsFetching] = useState(false)
  const lastScrollTime = useRef(Date.now())

  const handleScroll = useCallback(() => {
    if (!hasMore || isLoading || isFetching) return

    // Throttle scroll events
    const now = Date.now()
    if (now - lastScrollTime.current < 100) return
    lastScrollTime.current = now

    let scrollTop: number
    let scrollHeight: number
    let clientHeight: number

    if (containerRef?.current) {
      const container = containerRef.current
      scrollTop = container.scrollTop
      scrollHeight = container.scrollHeight
      clientHeight = container.clientHeight
    } else {
      // Fallback to window scroll if no container
      scrollTop = window.pageYOffset || document.documentElement.scrollTop
      scrollHeight = document.documentElement.scrollHeight
      clientHeight = window.innerHeight
    }

    // When user is within threshold pixels from bottom
    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      console.log('Scroll threshold reached, triggering load more', {
        scrollTop,
        scrollHeight,
        clientHeight,
        threshold,
        hasMore,
        isLoading,
        isFetching,
        usingContainer: !!containerRef?.current
      })
      setIsFetching(true)
    }
  }, [hasMore, isLoading, isFetching, threshold, containerRef])

  useEffect(() => {
    const container = containerRef?.current
    const targetElement = container || window
    
    targetElement.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      targetElement.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll, containerRef])

  // Reset isFetching when loading completes
  useEffect(() => {
    if (isFetching && !isLoading) {
      setIsFetching(false)
    }
  }, [isFetching, isLoading])

  // Manual check for edge cases
  const checkScroll = useCallback(() => {
    if (hasMore && !isLoading && !isFetching) {
      handleScroll()
    }
  }, [hasMore, isLoading, isFetching, handleScroll])

  return { isFetching, checkScroll }
}
