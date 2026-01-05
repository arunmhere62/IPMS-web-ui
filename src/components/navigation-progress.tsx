import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import LoadingBar, { type LoadingBarRef } from 'react-top-loading-bar'

export function NavigationProgress() {
  const ref = useRef<LoadingBarRef>(null)
  const location = useLocation()

  useEffect(() => {
    ref.current?.continuousStart()
    const t = window.setTimeout(() => ref.current?.complete(), 250)
    return () => window.clearTimeout(t)
  }, [location.pathname])

  return (
    <LoadingBar
      color='var(--muted-foreground)'
      ref={ref}
      shadow={true}
      height={2}
    />
  )
}
