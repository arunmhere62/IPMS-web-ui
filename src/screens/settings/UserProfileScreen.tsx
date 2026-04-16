import { useState, useEffect, useMemo } from 'react'
import {
  useLazyGetStatesQuery,
  useLazyGetCitiesQuery,
  type State,
  type City,
} from '@/services/locationApi'
import { useUpdateOrganizationMutation } from '@/services/organizationApi'
import {
  useGetUserProfileQuery,
  useChangePasswordMutation,
  type UserProfileResponse,
} from '@/services/userApi'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { updateUser, type AuthUser } from '@/store/slices/authSlice'
import type { RootState } from '@/store/store'
import {
  ChevronRight,
  Mail,
  User,
  Edit,
  MapPin,
  Building2,
  AlertCircle,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/form/page-header'

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getRoleBadgeColor = () => {
  return {
    bg: 'bg-primary/10',
    color: 'text-primary',
    border: 'border-primary/20',
  }
}

export function UserProfileScreen() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s: RootState) => s.auth.user)
  const selectedPGLocationId = useAppSelector(
    (s: RootState) => s.pgLocations?.selectedPGLocationId
  )

  const {
    data: profileResponse,
    refetch: refetchProfile,
    isFetching: isProfileFetching,
  } = useGetUserProfileQuery(user?.s_no as number, {
    skip: !user?.s_no,
  })
  const [changePasswordMutation] = useChangePasswordMutation()
  const [updateOrganizationMutation] = useUpdateOrganizationMutation()

  const [showEditModal, setShowEditModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [showOrgEditModal, setShowOrgEditModal] = useState(false)
  const [orgNameDraft, setOrgNameDraft] = useState('')
  const [orgSaving, setOrgSaving] = useState(false)
  const [stateName, setStateName] = useState<string>('')
  const [cityName, setCityName] = useState<string>('')
  const [profileData, setProfileData] = useState<AuthUser | null>(null)

  const [fetchStatesTrigger] = useLazyGetStatesQuery()
  const [fetchCitiesTrigger] = useLazyGetCitiesQuery()

  useEffect(() => {
    const data = (profileResponse as UserProfileResponse)?.data
    if (data) {
      setProfileData(data as AuthUser)
      dispatch(
        updateUser({
          name: data.name,
          email: data.email,
          phone: data.phone,
          role_id: data.role_id,
          role_name: data.role_name,
          organization_id: data.organization_id,
          organization_name: data.organization_name,
          pg_locations: data.pg_locations,
          status: data.status,
          address: data.address,
          city_id: data.city_id,
          state_id: data.state_id,
          gender: data.gender,
          profile_images: data.profile_images,
        })
      )

      if (data.state_name) {
        setStateName(data.state_name)
      }
      if (data.city_name) {
        setCityName(data.city_name)
      }
    }
  }, [profileResponse, dispatch])

  useEffect(() => {
    const fetchStateName = async (stateId: number) => {
      try {
        const response = await fetchStatesTrigger({
          countryCode: 'IN',
        }).unwrap()
        if (response?.success) {
          const items = response.data || []
          const state = items.find((s: State) => s.s_no === stateId)
          if (state) setStateName(state.name)
        }
      } catch (_error) {
        // Error fetching state name
      }
    }

    const fetchCityName = async (cityId: number) => {
      try {
        if (user?.state_id) {
          const stateResponse = await fetchStatesTrigger({
            countryCode: 'IN',
          }).unwrap()
          if (stateResponse?.success) {
            const states = stateResponse.data || []
            const state = states.find((s: State) => s.s_no === user.state_id)
            if (state?.iso_code) {
              const cityResponse = await fetchCitiesTrigger({
                stateCode: state.iso_code,
              }).unwrap()
              if (cityResponse?.success) {
                const cities = cityResponse.data || []
                const city = cities.find((c: City) => c.s_no === cityId)
                if (city) setCityName(city.name)
              }
            }
          }
        }
      } catch (_error) {
        // Error fetching city name
      }
    }

    if (user?.state_id) {
      fetchStateName(user.state_id)
    }
    if (user?.city_id) {
      fetchCityName(user.city_id)
    }
  }, [user?.state_id, user?.city_id, fetchStatesTrigger, fetchCitiesTrigger])

  const handleChangePassword = async (data: {
    currentPassword: string
    newPassword: string
  }) => {
    if (!user) return

    await changePasswordMutation({ userId: user.s_no, data }).unwrap()

    setShowChangePasswordModal(false)
  }

  const userData = user
  const roleBadge = getRoleBadgeColor()

  const canEditOrganization =
    Boolean(userData?.organization_id) &&
    (String(userData?.role_name || '').toUpperCase() === 'ADMIN' ||
      String(userData?.role_name || '').toUpperCase() === 'SUPER_ADMIN')

  const handleOpenOrganizationEdit = () => {
    const currentName = String(
      profileData?.organization_name || userData?.organization_name || ''
    ).trim()
    setOrgNameDraft(currentName)
    setShowOrgEditModal(true)
  }

  const handleSaveOrganizationName = async () => {
    const orgId = Number(userData?.organization_id)
    if (!orgId) {
      alert('Error: Organization not found for this user')
      return
    }

    const nextName = String(orgNameDraft || '').trim()
    if (!nextName) {
      alert('Error: Organization name is required')
      return
    }

    setOrgSaving(true)
    try {
      await updateOrganizationMutation({
        id: orgId,
        data: { name: nextName },
      }).unwrap()
      dispatch(updateUser({ organization_name: nextName }))
      setShowOrgEditModal(false)
      await refetchProfile()
    } catch (_error: unknown) {
      // Failed to update organization
      alert('Failed to update organization')
    } finally {
      setOrgSaving(false)
    }
  }

  const showSkeleton = isProfileFetching && !profileData

  const selectedPg = useMemo(() => {
    const pgs = profileData?.pg_locations
    if (!Array.isArray(pgs) || pgs.length === 0) return null
    const match = selectedPGLocationId
      ? pgs.find(
          (p: {
            s_no: number
            location_name: string
            address?: string
            pg_type?: string
            rent_cycle_type?: string
          }) => Number(p?.s_no) === Number(selectedPGLocationId)
        )
      : null
    return match || pgs[0] || null
  }, [profileData, selectedPGLocationId])

  return (
    <div className='container mx-auto max-w-4xl px-3 py-6'>
      <PageHeader title='My Profile' subtitle='Your account details' />

      <div className='mt-4 grid gap-4'>
        {showSkeleton ? (
          <>
            <Card>
              <CardContent className='p-6'>
                <div className='flex flex-col items-center'>
                  <div className='mb-4 size-20 animate-pulse rounded-full bg-muted' />
                  <div className='mb-2 h-6 w-48 animate-pulse rounded bg-muted' />
                  <div className='mb-4 h-4 w-32 animate-pulse rounded bg-muted' />
                  <div className='h-4 w-40 animate-pulse rounded bg-muted' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-4'>
                <div className='mb-3 h-5 w-36 animate-pulse rounded bg-muted' />
                <div className='mb-2 h-4 w-3/4 animate-pulse rounded bg-muted' />
                <div className='mb-2 h-4 w-1/2 animate-pulse rounded bg-muted' />
                <div className='h-4 w-2/3 animate-pulse rounded bg-muted' />
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-4'>
                <div className='mb-3 h-5 w-40 animate-pulse rounded bg-muted' />
                <div className='mb-2 h-4 w-3/4 animate-pulse rounded bg-muted' />
                <div className='h-4 w-1/2 animate-pulse rounded bg-muted' />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Profile Header Card */}
            <Card>
              <CardContent className='p-6'>
                <div className='flex flex-col items-center'>
                  {/* Profile Image */}
                  <div className='mb-4 flex size-20 items-center justify-center rounded-full border-2 border-border bg-primary'>
                    {userData?.profile_images ? (
                      <img
                        src={userData.profile_images as string}
                        alt='Profile'
                        className='size-[76px] rounded-full object-cover'
                      />
                    ) : (
                      <span className='text-2xl font-bold text-primary-foreground'>
                        {getInitials(userData?.name || 'User')}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className='mb-4 text-center'>
                    <h2 className='text-2xl font-bold'>{userData?.name}</h2>

                    {/* Role and Status Row */}
                    <div className='mt-2 flex items-center justify-center gap-2'>
                      <Badge
                        className={`${roleBadge.bg} ${roleBadge.color} ${roleBadge.border} border`}
                      >
                        {userData?.role_name?.replace('_', ' ') || 'User'}
                      </Badge>

                      <div
                        className={`size-2 rounded-full ${
                          userData?.status === 'ACTIVE'
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      />

                      <span className='text-xs font-medium text-muted-foreground'>
                        {userData?.status || 'ACTIVE'}
                      </span>
                    </div>
                  </div>

                  {/* Organization */}
                  {(userData?.organization_name ||
                    profileData?.organization_name) && (
                    <div className='mb-4 w-full rounded-lg bg-muted p-3'>
                      <div className='mb-1 flex items-center justify-between'>
                        <span className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
                          Organization
                        </span>

                        {canEditOrganization && (
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-6 px-2'
                            onClick={handleOpenOrganizationEdit}
                          >
                            <Edit className='size-3' />
                          </Button>
                        )}
                      </div>

                      <p className='text-sm font-semibold'>
                        {profileData?.organization_name ||
                          userData?.organization_name}
                      </p>
                      {profileData?.organization_description && (
                        <p className='text-xs text-muted-foreground italic'>
                          {profileData.organization_description}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Location Information */}
                  {(profileData?.city_name ||
                    profileData?.state_name ||
                    cityName ||
                    stateName) && (
                    <div className='mb-4 w-full rounded-lg bg-muted p-3'>
                      <span className='mb-1 block text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
                        Location
                      </span>
                      <div className='flex items-center'>
                        <MapPin className='mr-1 size-3.5 text-muted-foreground' />
                        <span className='text-sm font-medium'>
                          {profileData?.city_name && profileData?.state_name
                            ? `${profileData.city_name}, ${profileData.state_name}`
                            : profileData?.city_name ||
                              profileData?.state_name ||
                              cityName ||
                              stateName ||
                              'Not provided'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* PG Locations */}
                  {selectedPg && (
                    <div className='mb-4 w-full rounded-lg border border-border bg-muted p-4'>
                      <div className='mb-3 flex items-center'>
                        <div className='mr-3 flex size-8 items-center justify-center rounded-full bg-primary/10'>
                          <Building2 className='size-4 text-primary' />
                        </div>
                        <div className='flex-1'>
                          <p className='text-sm font-semibold'>
                            {selectedPg?.location_name}
                          </p>
                          {selectedPg?.address ? (
                            <p className='mb-1 text-xs text-muted-foreground'>
                              {selectedPg.address}
                            </p>
                          ) : null}

                          <div className='flex flex-wrap gap-1'>
                            {selectedPg?.pg_type ? (
                              <Badge
                                variant='outline'
                                className='border-primary/20 bg-primary/10 text-[10px] text-primary'
                              >
                                {selectedPg.pg_type}
                              </Badge>
                            ) : null}

                            {selectedPg?.rent_cycle_type ? (
                              <Badge
                                variant='outline'
                                className='border-primary/20 bg-primary/10 text-[10px] text-primary'
                              >
                                {selectedPg.rent_cycle_type}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Stats */}
                  <div className='flex w-full justify-around border-t border-border pt-4'>
                    <div className='text-center'>
                      <p className='mb-1 text-lg font-bold text-primary'>
                        {userData?.s_no || '--'}
                      </p>
                      <p className='text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                        ID
                      </p>
                    </div>

                    <div className='text-center'>
                      <p className='mb-1 max-w-[100px] truncate text-sm font-bold'>
                        {selectedPg?.location_name || '--'}
                      </p>
                      <p className='text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                        Selected PG
                      </p>
                    </div>

                    <div className='text-center'>
                      <p className='mb-1 text-lg font-bold text-primary'>
                        {userData?.role_id || '--'}
                      </p>
                      <p className='text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                        Role ID
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardContent className='p-4'>
                <div className='mb-4 flex items-center'>
                  <div className='mr-3 flex size-10 items-center justify-center rounded-full bg-primary/10'>
                    <Mail className='size-5 text-primary' />
                  </div>
                  <h3 className='text-base font-bold'>Contact Information</h3>
                </div>

                <div className='space-y-4'>
                  {/* Email */}
                  <div>
                    <p className='mb-1 text-xs text-muted-foreground'>
                      Email Address
                    </p>
                    <p className='text-base font-semibold'>
                      {userData?.email || 'Not provided'}
                    </p>
                  </div>

                  {/* Phone */}
                  {userData?.phone && (
                    <div>
                      <p className='mb-1 text-xs text-muted-foreground'>
                        Phone Number
                      </p>
                      <p className='text-base font-semibold'>
                        {userData.phone}
                      </p>
                    </div>
                  )}

                  {/* Address */}
                  {userData?.address && (
                    <div>
                      <p className='mb-1 text-xs text-muted-foreground'>
                        Address
                      </p>
                      <p className='text-base leading-6 font-semibold'>
                        {userData.address}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Personal Details */}
            <Card>
              <CardContent className='p-4'>
                <div className='mb-4 flex items-center'>
                  <div className='mr-3 flex size-10 items-center justify-center rounded-full bg-primary/10'>
                    <User className='size-5 text-primary' />
                  </div>
                  <h3 className='text-base font-bold'>Personal Details</h3>
                </div>

                <div className='space-y-4'>
                  {/* Gender */}
                  {userData?.gender && (
                    <div>
                      <p className='mb-1 text-xs text-muted-foreground'>
                        Gender
                      </p>
                      <p className='text-base font-semibold'>
                        {userData.gender}
                      </p>
                    </div>
                  )}

                  {/* User ID */}
                  <div>
                    <p className='mb-1 text-xs text-muted-foreground'>
                      User ID
                    </p>
                    <p className='text-base font-semibold'>#{userData?.s_no}</p>
                  </div>

                  {/* Joined Date */}
                  {(userData?.created_at || profileData?.created_at) && (
                    <div>
                      <p className='mb-1 text-xs text-muted-foreground'>
                        Member Since
                      </p>
                      <p className='text-base font-semibold'>
                        {new Date(
                          profileData?.created_at || userData?.created_at
                        ).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
              <CardContent className='p-4'>
                <div className='divide-y'>
                  <Button
                    variant='ghost'
                    className='h-auto w-full justify-start px-0 py-4 hover:bg-transparent'
                    onClick={() => setShowEditModal(true)}
                  >
                    <div className='flex flex-1 items-center gap-3'>
                      <div className='flex size-8 items-center justify-center rounded-lg bg-primary/10'>
                        <Edit className='size-4 text-primary' />
                      </div>
                      <span className='font-semibold'>Edit Profile</span>
                    </div>
                    <ChevronRight className='size-5 text-muted-foreground' />
                  </Button>

                  <Button
                    variant='ghost'
                    className='h-auto w-full justify-start px-0 py-4 hover:bg-transparent'
                    onClick={() => setShowChangePasswordModal(true)}
                  >
                    <div className='flex flex-1 items-center gap-3'>
                      <div className='flex size-8 items-center justify-center rounded-lg bg-primary/10'>
                        <AlertCircle className='size-4 text-primary' />
                      </div>
                      <span className='font-semibold'>Change Password</span>
                    </div>
                    <ChevronRight className='size-5 text-muted-foreground' />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Organization Edit Dialog */}
      <AlertDialog open={showOrgEditModal} onOpenChange={setShowOrgEditModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Update your organization name
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='py-4'>
            <Label htmlFor='org-name'>Organization Name</Label>
            <Input
              id='org-name'
              value={orgNameDraft}
              onChange={(e) => setOrgNameDraft(e.target.value)}
              placeholder='Enter organization name'
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={orgSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveOrganizationName}
              disabled={orgSaving}
            >
              {orgSaving ? 'Saving...' : 'Save'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Dialog */}
      <AlertDialog
        open={showChangePasswordModal}
        onOpenChange={setShowChangePasswordModal}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Password</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your current and new password
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='space-y-4 py-4'>
            <div>
              <Label htmlFor='current-password'>Current Password</Label>
              <Input
                id='current-password'
                type='password'
                placeholder='Enter current password'
              />
            </div>
            <div>
              <Label htmlFor='new-password'>New Password</Label>
              <Input
                id='new-password'
                type='password'
                placeholder='Enter new password'
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const currentPassword = (
                  document.getElementById(
                    'current-password'
                  ) as HTMLInputElement
                )?.value
                const newPassword = (
                  document.getElementById('new-password') as HTMLInputElement
                )?.value
                if (currentPassword && newPassword) {
                  handleChangePassword({ currentPassword, newPassword })
                }
              }}
            >
              Change Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Profile Dialog - Placeholder for now */}
      <AlertDialog open={showEditModal} onOpenChange={setShowEditModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Edit profile functionality coming soon
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
