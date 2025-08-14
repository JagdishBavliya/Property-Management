import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import Hashids from 'hashids';
import Head from 'next/head';

// Components
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import UserAvatar from '../../components/ui/UserAvatar';
import Breadcrumb from '../../components/ui/Breadcrumb';

import { fetchManagersForCurrentUser, selectUsers, selectUsersLoading, selectUsersError } from '../../store/slices/usersSlice';
import { UserIcon, EnvelopeIcon, PhoneIcon, UserGroupIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

export default function ManagerDetailPage() {
  const router = useRouter();
  const { hashid } = router.query;
  const dispatch = useDispatch();
  const users = useSelector(selectUsers);
  const loading = useSelector(selectUsersLoading);
  const error = useSelector(selectUsersError);

  const hashids = new Hashids('your-salt-string', 6);
  const id = hashids.decode(hashid)[0];
  useEffect(() => {
    if (!users.length) dispatch(fetchManagersForCurrentUser({ page: 1, limit: 100 }));
  }, [dispatch, users.length]);
  const manager = users.find(u => String(u.id) === String(id));

  return (
    <>
      <Head>
        <title>{manager ? manager.name : 'Manager Details'} | PMS</title>
      </Head>
      <div className="container-responsive animate-fade-in">
        {/* Page Header with Icon and Accent */}
        <div className="relative mb-10">
          <div className="absolute inset-0 h-32 bg-gradient-to-r from-primary-100 via-accent-50 to-white rounded-2xl blur-sm opacity-80 -z-10" />
          <div className="flex items-center gap-4 py-6">
            <Breadcrumb
              items={[
                { label: 'Managers', href: '/managers' },
                { label: manager?.name || 'Manager', icon: UserIcon }
              ]}
              backButtonText="Managers"
              backButtonHref="/managers"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left: Avatar & Basic Info */}
          <div className="xl:col-span-1">
            <Card className="flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 p-8 border border-gray-100 shadow-soft">
            <UserAvatar user={manager} size="xl" className="mb-4" />
            <div className="text-xl font-bold text-gray-900 mb-1">{manager?.name}</div>
            <Badge variant="primary" size="md" className="mb-2">Manager</Badge>
            <div className="flex items-center gap-2 text-gray-500 mt-2">
              <EnvelopeIcon className="h-5 w-5" />
              <span>{manager?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 mt-1">
              <PhoneIcon className="h-5 w-5" />
              <span>{manager?.phone}</span>
            </div>
            <div className="mt-4">
              <Badge variant="secondary" size="sm">
                <UserGroupIcon className="w-3 h-3 mr-1" />
                {manager?.user_code}
              </Badge>
            </div>
          </Card>
          </div>

                    {/* Middle: Details */}
          <div className="xl:col-span-3">
            <Card className="p-0 overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader />
                </div>
              ) : error ? (
                <div className="text-red-500 text-center py-8">{error}</div>
              ) : !manager ? (
                <div className="text-gray-500 text-center py-8">Manager not found.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-8">
              {/* Left column: Role/Code */}
              <div className="space-y-8">
                {/* Email Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center">
                      <EnvelopeIcon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-base font-bold text-gray-600">Email</span>
                  </div>
                  <div className="ml-9">
                    <div className="text-xs text-gray-500 mb-1">Address</div>
                    <div className="text-base font-semibold text-gray-800">{manager?.email || 'N/A'}</div>
                  </div>
                </div>
                {/* Phone Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center">
                      <PhoneIcon className="w-4 h-4 text-teal-600" />
                    </div>
                    <span className="text-base font-bold text-gray-600">Phone</span>
                  </div>
                  <div className="ml-9">
                    <div className="text-xs text-gray-500 mb-1">Number</div>
                    <div className="text-base font-semibold text-gray-800">{manager?.phone || 'N/A'}</div>
                  </div>
                </div>
              </div>
              {/* Right column: Email/Phone */}
              <div className="space-y-8">
                {/* Code Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center">
                      <ClipboardDocumentListIcon className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-base font-bold text-gray-600">Code</span>
                  </div>
                  <div className="ml-9">
                    <div className="text-xs text-gray-500 mb-1">Manager Code</div>
                    <Badge variant="warning" size="sm" className="mb-2">
                      <ClipboardDocumentListIcon className="w-3 h-3 mr-1" />
                      {manager?.user_code || 'N/A'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
                )}
          </Card>
          </div>

          {/* Right: Dummy Widgets Section */}
          <div className="xl:col-span-4 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card variant="elevated" className="flex items-center gap-4">
                <UserIcon className="h-10 w-10 text-accent-500 bg-accent-100 rounded-xl p-2" />
                <div>
                  <div className="text-lg font-bold text-gray-900">Team Performance</div>
                  <div className="text-sm text-gray-500">Coming soon: Manager&apos;s team stats and activity</div>
                </div>
              </Card>
              <Card variant="elevated" className="flex items-center gap-4">
                <ClipboardDocumentListIcon className="h-10 w-10 text-primary-500 bg-primary-100 rounded-xl p-2" />
                <div>
                  <div className="text-lg font-bold text-gray-900">Notes & Activity</div>
                  <div className="text-sm text-gray-500">Coming soon: Manager&apos;s notes, logs, and more</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 