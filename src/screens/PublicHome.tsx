import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  BedDouble,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  HandCoins,
  Headset,
  LayoutDashboard,
  LineChart,
  MapPin,
  MessageSquareText,
  Receipt,
  ShieldCheck,
  UsersRound,
  Wallet,
  XCircle,
} from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import bannerMultiplePgSelection from '@/assets/banner-add-images/mutiple-pg-selection.png'
import bannerRentFollowUps from '@/assets/banner-add-images/rent-follow-ups.png'
import bannerRoomBedAllocation from '@/assets/banner-add-images/room-bed-allocation.png'
import bannerTenantRent from '@/assets/banner-add-images/tenant-rent-banner.png'

export function PublicHome() {
  const banners = useMemo(
    () => [
      {
        title: 'Multi PG selection',
        subtitle: 'Manage multiple locations with a clean workflow.',
        src: bannerMultiplePgSelection,
        imgPosition: '50% 62%' as const,
      },
      {
        title: 'Rent follow ups',
        subtitle: 'Stay on top of dues and payment reminders.',
        src: bannerRentFollowUps,
        imgPosition: '50% 63%' as const,
      },
      {
        title: 'Room & bed allocation',
        subtitle: 'Allocate beds, track inventory, and avoid conflicts.',
        src: bannerRoomBedAllocation,
        imgPosition: '50% 60%' as const,
      },
      {
        title: 'Tenant rent tracking',
        subtitle: 'Track rent cycles, receipts, and tenant history.',
        src: bannerTenantRent,
        imgPosition: '50% 62%' as const,
      },
    ],
    []
  )

  const showcaseRef = useRef<HTMLDivElement | null>(null)
  const [activeBanner, setActiveBanner] = useState(0)
  const [showcasePaused, setShowcasePaused] = useState(false)
  const [showcaseInView, setShowcaseInView] = useState(() => {
    if (typeof window === 'undefined') return false
    return !('IntersectionObserver' in window)
  })

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' })

  const goToBanner = (index: number) => {
    if (!emblaApi) return
    emblaApi.scrollTo(index)
  }

  const scrollPrev = () => {
    emblaApi?.scrollPrev()
  }

  const scrollNext = () => {
    emblaApi?.scrollNext()
  }

  useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => {
      setActiveBanner(emblaApi.selectedScrollSnap())
    }

    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi])

  useEffect(() => {
    const host = showcaseRef.current
    if (!host) return
    if (!('IntersectionObserver' in window)) return

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setShowcaseInView(Boolean(entry?.isIntersecting))
      },
      { threshold: 0.25 }
    )

    io.observe(host)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (showcasePaused) return
    if (!showcaseInView) return
    if (banners.length <= 1) return
    if (!emblaApi) return

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    if (prefersReducedMotion) return

    const id = window.setInterval(() => {
      emblaApi.scrollNext()
    }, 4500)

    return () => window.clearInterval(id)
  }, [banners.length, emblaApi, showcasePaused, showcaseInView])

  const problems = useMemo(
    () => [
      { title: 'Rent tracking in Excel', icon: FileText },
      { title: 'Bed availability confusion', icon: BedDouble },
      { title: 'Advance & refund disputes', icon: HandCoins },
      { title: 'Payment follow-ups on WhatsApp', icon: MessageSquareText },
      { title: 'No clear monthly profit', icon: LineChart },
    ],
    []
  )

  const solutions = useMemo(
    () => [
      { title: 'Invoices & receipts', subtitle: 'Generate invoices for rent, advance and refunds.', icon: Receipt },
      { title: 'Smart due tracking', subtitle: 'Pending + partial rent status at a glance.', icon: Wallet },
      { title: 'WhatsApp + SMS reminders', subtitle: 'Send reminders to tenants without chaos.', icon: MessageSquareText },
      { title: 'Owner notifications', subtitle: 'Get reminders for pending and partial payments.', icon: Bell },
      { title: 'Expenses & profit', subtitle: 'Track expenses and see monthly profit clearly.', icon: LineChart },
      { title: 'Multi-PG locations', subtitle: 'Manage multiple PGs from one dashboard.', icon: MapPin },
    ],
    []
  )

  const keyFeatures = useMemo(
    () => [
      { title: 'Smart Dashboard', subtitle: 'Collections, dues, occupancy and profit.', icon: LayoutDashboard },
      { title: 'Unlimited setup (Free 30 days)', subtitle: 'Beds, rooms, tenants, employees — unlimited.', icon: Clock },
      { title: 'Invoices (Rent/Advance/Refund)', subtitle: 'Professional invoices and receipts.', icon: Receipt },
      { title: 'WhatsApp + SMS reminders', subtitle: 'Send reminders instantly to tenants.', icon: MessageSquareText },
      { title: 'Pending + Partial notifications', subtitle: 'Owner alerts so you never miss payments.', icon: Bell },
      { title: 'Expenses tracking', subtitle: 'Record expenses and see real profit.', icon: LineChart },
    ],
    []
  )

  const audiences = useMemo(
    () => [
      { title: 'Single PG owners', subtitle: 'Stop managing with Excel and WhatsApp.', icon: Building2 },
      { title: 'Multiple PG owners', subtitle: 'Manage all locations from one dashboard.', icon: MapPin },
      { title: 'Hostel / Co-living managers', subtitle: 'Reports, invoices and smooth collections.', icon: ShieldCheck },
      { title: 'Managers & caretakers', subtitle: 'Fast daily workflows and reminders.', icon: UsersRound },
    ],
    []
  )

  const benefits = useMemo(
    () => [
      { title: 'Faster collections', subtitle: 'WhatsApp/SMS reminders + owner notifications for dues.' },
      { title: 'Zero vacancy confusion', subtitle: 'Live bed & occupancy view across rooms.' },
      { title: 'Fewer disputes', subtitle: 'Invoices for rent, advance, and refunds with history.' },
      { title: 'Real profit visibility', subtitle: 'Income vs expenses summary every month.' },
      { title: 'Scale confidently', subtitle: 'Multi-PG support + unlimited setup for 30 days free.' },
    ],
    []
  )

  return (
    <div className='pb-16'>
      <div className='container mx-auto max-w-6xl px-4 py-10 sm:py-12'>
        <div className='relative overflow-hidden rounded-3xl border border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.75),rgba(255,255,255,0.45))] p-6 shadow-[0_22px_60px_rgba(15,23,42,0.10)] backdrop-blur sm:p-10'>
          <div className='pointer-events-none absolute -left-20 -top-28 h-[320px] w-[320px] rounded-full bg-primary/15 blur-3xl' />
          <div className='pointer-events-none absolute -right-24 top-20 h-[360px] w-[360px] rounded-full bg-emerald-500/10 blur-3xl' />

          <div className='relative grid gap-10 lg:grid-cols-2 lg:items-center'>
            <div className='min-w-0'>
              <Badge variant='secondary' className='mb-4'>
                IPMS - Indian PG Management System
              </Badge>

              <div className='text-3xl font-semibold leading-tight sm:text-5xl'>
                Manage your PG rent, beds & tenants — all in one app
              </div>
              <div className='mt-3 text-base text-muted-foreground sm:text-lg'>
                Track rent, advance, vacancies, and expenses without Excel or WhatsApp.
              </div>

              <div className='mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap'>
                <Button asChild>
                  <Link to='/signup'>Start Free</Link>
                </Button>
                <Button asChild variant='outline'>
                  <Link to='/subscriptions'>View Pricing</Link>
                </Button>
              </div>

              <div className='mt-5 flex flex-wrap items-center gap-1.5'>
                {banners.map((b, idx) => (
                  <button
                    key={b.title}
                    type='button'
                    aria-label={`Go to ${b.title}`}
                    onClick={() => goToBanner(idx)}
                    className={
                      'h-2 w-2 rounded-full transition ' +
                      (idx === activeBanner
                        ? 'bg-primary'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50')
                    }
                  />
                ))}
              </div>

              <div className='mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3'>
                <div className='rounded-2xl border bg-white/70 p-4 shadow-sm backdrop-blur'>
                  <div className='text-sm font-semibold'>Never miss rent</div>
                  <div className='mt-1 text-xs text-muted-foreground'>Follow-ups for pending & partial rent.</div>
                </div>
                <div className='rounded-2xl border bg-white/70 p-4 shadow-sm backdrop-blur'>
                  <div className='text-sm font-semibold'>Know vacancy instantly</div>
                  <div className='mt-1 text-xs text-muted-foreground'>Bed & occupancy status at a glance.</div>
                </div>
                <div className='rounded-2xl border bg-white/70 p-4 shadow-sm backdrop-blur'>
                  <div className='text-sm font-semibold'>Profit clarity</div>
                  <div className='mt-1 text-xs text-muted-foreground'>Income vs expense summary per month.</div>
                </div>
              </div>
            </div>

            <div
              ref={showcaseRef}
              className='min-w-0'
              onMouseEnter={() => setShowcasePaused(true)}
              onMouseLeave={() => setShowcasePaused(false)}
              onFocusCapture={() => setShowcasePaused(true)}
              onBlurCapture={() => setShowcasePaused(false)}
            >
              <div className='mx-auto w-full max-w-[420px] rounded-3xl border border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.70),rgba(255,255,255,0.40))] p-4 backdrop-blur-sm shadow-[0_16px_50px_rgba(15,23,42,0.16)] sm:p-6'>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <div className='text-sm font-semibold'>App preview</div>
                  <div className='flex items-center gap-2'>
                    <Button type='button' variant='outline' size='icon' className='h-9 w-9' onClick={scrollPrev}>
                      <ChevronLeft className='size-4' />
                    </Button>
                    <Button type='button' variant='outline' size='icon' className='h-9 w-9' onClick={scrollNext}>
                      <ChevronRight className='size-4' />
                    </Button>
                  </div>
                </div>

                <div className='mt-5'>
                  <div ref={emblaRef} className='overflow-hidden'>
                    <div className='flex -ml-4'>
                      {banners.map((b, idx) => (
                        <div
                          key={b.title}
                          className='min-w-0 flex-[0_0_100%] pl-4 sm:flex-[0_0_360px]'
                        >
                          <div className='grid gap-3'>
                            <div className='relative mx-auto w-full max-w-[360px]'>
                              <div className='rounded-[2.75rem] bg-[linear-gradient(180deg,rgba(37,99,235,0.35),rgba(0,0,0,0.9))] p-2 shadow-2xl'>
                                <div className='relative overflow-hidden rounded-[2.25rem] bg-black'>
                                  <img
                                    src={b.src}
                                    alt={b.title}
                                    className='h-[min(52vh,360px)] w-full object-contain sm:h-[520px] lg:h-[560px]'
                                    style={{ objectPosition: b.imgPosition }}
                                    loading={idx === 0 ? 'eager' : 'lazy'}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className='px-1'>
                              <div className='text-sm font-semibold'>{b.title}</div>
                              <div className='mt-1 text-xs text-muted-foreground'>{b.subtitle}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className='mt-3 flex items-center justify-between gap-3'>
                    <div className='flex flex-wrap items-center gap-1.5'>
                      {banners.map((b, idx) => (
                        <button
                          key={b.title}
                          type='button'
                          aria-label={`Go to ${b.title}`}
                          onClick={() => goToBanner(idx)}
                          className={
                            'h-2 w-2 rounded-full transition ' +
                            (idx === activeBanner
                              ? 'bg-primary'
                              : 'bg-muted-foreground/30 hover:bg-muted-foreground/50')
                          }
                        />
                      ))}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {activeBanner + 1} / {banners.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-20 grid gap-3'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 rounded-2xl bg-destructive/10 text-destructive' />
            <div className='text-2xl font-semibold'>The problem</div>
          </div>
          <div className='text-sm text-muted-foreground'>
            Common issues PG owners face when everything is manual.
          </div>
        </div>

        <div className='relative mt-6 overflow-hidden rounded-3xl border border-destructive/10 bg-[linear-gradient(180deg,rgba(254,242,242,0.70),rgba(255,255,255,0.40))] p-5 backdrop-blur sm:p-7'>
          <div className='pointer-events-none absolute -left-24 -top-24 h-[340px] w-[340px] rounded-full bg-destructive/10 blur-3xl' />
          <div className='relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {problems.map((p, idx) => {
              const Icon = p.icon
              const details = [
                'Keeping rent in Excel leads to wrong totals and missing history.',
                'Vacancy changes daily. Manual updates lead to double allocation.',
                'Advance/refund disputes happen without records and receipts.',
                'WhatsApp follow-ups are scattered and easy to miss.',
                'No expense tracking means profit is never truly clear.',
              ]
              return (
                <div
                  key={p.title}
                  className='group rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur transition hover:shadow-md'
                >
                  <div className='flex items-start gap-3'>
                    <div className='flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive'>
                      <XCircle className='size-5' />
                    </div>
                    <div className='min-w-0'>
                      <div className='flex items-center gap-2'>
                        <Icon className='size-4 text-muted-foreground' />
                        <div className='text-sm font-semibold'>{p.title}</div>
                      </div>
                      <div className='mt-2 text-sm text-muted-foreground'>
                        {details[idx] ?? 'Manual tracking causes confusion, delays, and disputes.'}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className='mt-20 grid gap-3'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 rounded-2xl bg-primary/10' />
            <div className='text-2xl font-semibold'>The solution</div>
          </div>
          <div className='text-sm text-muted-foreground'>
            IPMS replaces manual tracking with invoices, reminders, and clear dashboards.
          </div>
        </div>

        <div className='relative mt-6 overflow-hidden rounded-3xl border border-primary/10 bg-[radial-gradient(900px_circle_at_25%_0%,rgba(37,99,235,0.12),transparent_55%),radial-gradient(900px_circle_at_95%_70%,rgba(16,185,129,0.10),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.75),rgba(255,255,255,0.45))] p-5 backdrop-blur sm:p-7'>
          <div className='grid gap-4 lg:grid-cols-12'>
            <div className='lg:col-span-4'>
              <div className='h-full rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <div className='text-base font-semibold'>One app. One dashboard.</div>
                <div className='mt-2 text-sm text-muted-foreground'>
                  Track occupancy, invoices, reminders, and expenses across all your PG locations.
                </div>
                <div className='mt-5 grid gap-2 text-sm text-muted-foreground'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='size-4 text-primary' />
                    Rent/advance/refund invoices
                  </div>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='size-4 text-primary' />
                    WhatsApp/SMS + owner notifications
                  </div>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='size-4 text-primary' />
                    Expenses + profit reports
                  </div>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='size-4 text-primary' />
                    Free 30 days (unlimited setup)
                  </div>
                </div>
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2 lg:col-span-8'>
              {solutions.map((s) => {
                const Icon = s.icon
                return (
                  <div
                    key={s.title}
                    className='rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur transition hover:shadow-md'
                  >
                    <div className='flex items-start gap-3'>
                      <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                        <Icon className='size-5' />
                      </div>
                      <div className='min-w-0'>
                        <div className='text-base font-semibold'>{s.title}</div>
                        <div className='mt-1 text-sm text-muted-foreground'>{s.subtitle}</div>
                        <div className='mt-3 flex items-center gap-2 text-xs text-muted-foreground'>
                          <CheckCircle2 className='size-4 text-primary' />
                          Included
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className='mt-20 grid gap-3'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 rounded-2xl bg-violet-500/10' />
            <div className='text-2xl font-semibold'>Key features</div>
          </div>
          <div className='text-sm text-muted-foreground'>
            Clear features built for real PG operations.
          </div>
        </div>

        <div className='relative mt-6 overflow-hidden rounded-3xl border border-violet-500/10 bg-[radial-gradient(900px_circle_at_0%_10%,rgba(168,85,247,0.12),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.70),rgba(255,255,255,0.40))] p-5 backdrop-blur sm:p-7'>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {keyFeatures.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className='rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur'>
                  <div className='flex items-start gap-3'>
                    <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                      <Icon className='size-5' />
                    </div>
                    <div>
                      <div className='text-base font-semibold'>{f.title}</div>
                      <div className='mt-1 text-sm text-muted-foreground'>{f.subtitle}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className='mt-20 rounded-3xl border border-emerald-500/10 bg-[radial-gradient(900px_circle_at_85%_0%,rgba(16,185,129,0.12),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.70),rgba(255,255,255,0.40))] p-6 backdrop-blur sm:p-8'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
            <div>
              <div className='text-2xl font-semibold'>How it works</div>
              <div className='mt-1 text-sm text-muted-foreground'>
                Simple flow. No training needed.
              </div>
            </div>
            <Badge variant='outline'>3 steps</Badge>
          </div>

          <div className='mt-6 grid gap-4 sm:grid-cols-3'>
            <div className='rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur'>
              <div className='text-xs font-semibold text-muted-foreground'>STEP 01</div>
              <div className='mt-2 text-base font-semibold'>Create PG & rooms/beds</div>
              <div className='mt-1 text-sm text-muted-foreground'>Unlimited rooms and beds in the free trial.</div>
            </div>
            <div className='rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur'>
              <div className='text-xs font-semibold text-muted-foreground'>STEP 02</div>
              <div className='mt-2 text-base font-semibold'>Add tenants & employees</div>
              <div className='mt-1 text-sm text-muted-foreground'>Assign beds and track occupancy instantly.</div>
            </div>
            <div className='rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur'>
              <div className='text-xs font-semibold text-muted-foreground'>STEP 03</div>
              <div className='mt-2 text-base font-semibold'>Invoices, reminders & reports</div>
              <div className='mt-1 text-sm text-muted-foreground'>Rent/advance/refund invoices, WhatsApp/SMS, and expenses.</div>
            </div>
          </div>
        </div>

        <div className='mt-20 grid gap-3'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 rounded-2xl bg-sky-500/10' />
            <div className='text-2xl font-semibold'>Who it’s for</div>
          </div>
          <div className='text-sm text-muted-foreground'>
            Designed for anyone responsible for rent collection and occupancy.
          </div>
        </div>

        <div className='relative mt-6 overflow-hidden rounded-3xl border border-sky-500/10 bg-[radial-gradient(900px_circle_at_100%_10%,rgba(14,165,233,0.12),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.70),rgba(255,255,255,0.40))] p-5 backdrop-blur sm:p-7'>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {audiences.map((a) => {
              const Icon = a.icon
              return (
                <div key={a.title} className='rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur'>
                  <div className='flex items-start gap-3'>
                    <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                      <Icon className='size-5' />
                    </div>
                    <div>
                      <div className='text-base font-semibold'>{a.title}</div>
                      <div className='mt-1 text-sm text-muted-foreground'>{a.subtitle}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className='mt-20 grid gap-3'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 rounded-2xl bg-amber-500/10' />
            <div className='text-2xl font-semibold'>Benefits</div>
          </div>
          <div className='text-sm text-muted-foreground'>
            Outcomes that directly improve collections and reduce daily work.
          </div>
        </div>

        <div className='relative mt-6 overflow-hidden rounded-3xl border border-amber-500/10 bg-[radial-gradient(900px_circle_at_0%_15%,rgba(245,158,11,0.12),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.70),rgba(255,255,255,0.40))] p-5 backdrop-blur sm:p-7'>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {benefits.map((b) => (
              <div key={b.title} className='rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur'>
                <div className='flex items-start gap-3'>
                  <CheckCircle2 className='mt-0.5 size-5 text-primary' />
                  <div>
                    <div className='text-base font-semibold'>{b.title}</div>
                    <div className='mt-1 text-sm text-muted-foreground'>{b.subtitle}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='mt-20 grid gap-3'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 rounded-2xl bg-fuchsia-500/10' />
            <div className='text-2xl font-semibold'>Pricing</div>
          </div>
          <div className='text-sm text-muted-foreground'>
            Choose a plan that fits your PG size. Billing happens in the mobile app.
          </div>
        </div>

        <div className='relative mt-6 overflow-hidden rounded-3xl border border-fuchsia-500/10 bg-[radial-gradient(900px_circle_at_80%_0%,rgba(217,70,239,0.12),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.70),rgba(255,255,255,0.40))] p-6 backdrop-blur sm:p-8'>
          <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div className='text-sm text-muted-foreground'>
              View all plans and features on the subscriptions page.
            </div>
            <Button asChild>
              <Link to='/subscriptions'>View Pricing</Link>
            </Button>
          </div>
        </div>

        <div className='mt-20 rounded-3xl border border-slate-900/10 bg-[radial-gradient(900px_circle_at_0%_0%,rgba(15,23,42,0.06),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.75),rgba(255,255,255,0.45))] p-6 backdrop-blur sm:p-8'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <div className='text-2xl font-semibold'>Trusted workflows</div>
              <div className='mt-2 text-sm text-muted-foreground'>
                Built around daily PG operations: beds, tenants, dues, and collections.
              </div>
              <div className='mt-4 grid gap-2 text-sm text-muted-foreground'>
                <div className='flex items-center gap-2'><ShieldCheck className='size-4 text-primary' />Invoices + history for rent/advance/refund</div>
                <div className='flex items-center gap-2'><Bell className='size-4 text-primary' />Pending + partial notifications for owners</div>
                <div className='flex items-center gap-2'><MessageSquareText className='size-4 text-primary' />WhatsApp/SMS reminders to tenants</div>
                <div className='flex items-center gap-2'><Headset className='size-4 text-primary' />Support & help when you need it</div>
              </div>
            </div>

            <div className='grid gap-3 sm:w-[320px]'>
              <div className='rounded-2xl border bg-white/70 p-4 shadow-sm backdrop-blur'>
                <div className='text-sm font-semibold'>Free 30 days</div>
                <div className='mt-1 text-xs text-muted-foreground'>Unlimited beds, rooms, tenants, employees + WhatsApp/SMS.</div>
              </div>
              <div className='rounded-2xl border bg-white/70 p-4 shadow-sm backdrop-blur'>
                <div className='text-sm font-semibold'>Expenses included</div>
                <div className='mt-1 text-xs text-muted-foreground'>Track expenses and see real profit clearly.</div>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-20 rounded-3xl border border-primary/15 bg-[radial-gradient(900px_circle_at_20%_0%,rgba(37,99,235,0.14),transparent_55%),radial-gradient(900px_circle_at_85%_70%,rgba(16,185,129,0.10),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.50))] p-6 backdrop-blur sm:p-10'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <div className='text-2xl font-semibold'>Ready to grow your PG with IPMS?</div>
              <div className='mt-2 text-sm text-muted-foreground'>
                Start free today and switch from Excel + WhatsApp to one clear system.
              </div>
            </div>
            <div className='flex flex-wrap gap-3'>
              <Button asChild>
                <Link to='/signup'>Start Free</Link>
              </Button>
              <Button asChild variant='outline'>
                <Link to='/subscriptions'>View Pricing</Link>
              </Button>
            </div>
          </div>
          <div className='mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
            <div className='flex items-center gap-2'><CheckCircle2 className='size-4 text-primary' />Fast setup</div>
            <div className='flex items-center gap-2'><CheckCircle2 className='size-4 text-primary' />Multi-PG ready</div>
            <div className='flex items-center gap-2'><CheckCircle2 className='size-4 text-primary' />Works on mobile</div>
          </div>
        </div>
      </div>
    </div>
  )
}
