// External imports
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Hashids from 'hashids';
import axiosInstance from '../../utils/axiosInstance';

// UI components
import Card from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { FORMATDATE } from '../../utils/constants';

// Icons
import {
  CalendarIcon, UserIcon, PhoneIcon, ClipboardDocumentListIcon,
  HomeIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon,
  ArrowPathIcon, ClockIcon, SparklesIcon,
} from '@heroicons/react/24/outline';

// --- Status Badge Component ---
const STATUS_CONFIG = {
  'Interested': { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
  'Not Interested': { color: 'bg-red-100 text-red-800', icon: XCircleIcon },
  'Follow-Up': { color: 'bg-blue-100 text-blue-800', icon: ArrowPathIcon },
  'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
  'Converted': { color: 'bg-purple-100 text-purple-800', icon: SparklesIcon },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { color: 'bg-gray-100 text-gray-800', icon: ClockIcon };
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      <Icon className="w-4 h-4 mr-1" />
      {status}
    </span>
  );
}

// --- Main Visit Details Page ---
export default function VisitDetailPage() {
  const router = useRouter();
  const { hashid } = router.query;
  const hashids = new Hashids('your-salt-string', 6);
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch visit details
  useEffect(() => {
    if (!hashid) return;
    const id = hashids.decode(hashid)[0];
    if (!id) {
      setError("Invalid visit ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    axiosInstance.get(`/api/visits/${id}`)
      .then(res => {
        setVisit(res.data.visit);
        setError("");
      })
      .catch(() => {
        setError("Visit not found");
        setVisit(null);
      })
      .finally(() => setLoading(false));
  }, [hashid]);

  return (
    <>
      <Head>
        <title>{visit ? `Visit #${visit.id}` : 'Visit Details'} | PMS</title>
      </Head>
      <div className="container-responsive animate-fade-in">
        {/* --- Page Header --- */}
        <div className="relative mb-10">
          <div className="absolute inset-0 h-32 bg-gradient-to-r from-primary-100 via-accent-50 to-white rounded-2xl blur-sm opacity-80 -z-10" />
          <div className="flex items-center gap-4 py-6">
            <Breadcrumb
              items={[
                { label: 'Visits', href: '/visits' },
                { label: visit?.property_code || 'Visit', icon: HomeIcon }
              ]}
              backButtonText="Visits"
              backButtonHref="/visits"
            />
          </div>
        </div>

        {/* --- Summary Row --- */}
        {visit && (
          <div className="mb-8">
            <Card className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center gap-4">
                <HomeIcon className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="text-lg font-bold text-gray-900">{visit.property_code}</div>
                  <div className="text-xs text-gray-500">Property Code</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <CalendarIcon className="h-6 w-6 text-primary-500" />
                <div>
                  <div className="text-base font-semibold text-gray-800">{FORMATDATE(visit.visit_date, 3)}</div>
                  <div className="text-xs text-gray-500">Visit Date</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={visit.visit_status} />
              </div>
            </Card>
          </div>
        )}

        {/* --- Main Content --- */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* --- Left: Basic Info --- */}
          <div className="xl:col-span-1">
            <Card className="flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 p-8 border border-gray-100 shadow-xl rounded-2xl">
              <div className="relative mb-4">
                <CalendarIcon className="h-14 w-14 text-primary-600" />
                <span className="absolute top-0 right-0 bg-white border border-gray-200 rounded-full px-2 py-1 text-xs font-bold text-primary-600 shadow">#{visit?.id}</span>
              </div>
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="flex items-center gap-2 text-gray-700">
                  <UserIcon className="h-5 w-5" />
                  <span className="font-semibold">Agent:</span>
                  <span className="font-mono">{visit?.agent_code}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <ClipboardDocumentListIcon className="h-5 w-5" />
                  <span className="font-semibold">Manager:</span>
                  <span className="font-mono">{visit?.manager_code || 'N/A'}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* --- Right: Details --- */}
          <div className="xl:col-span-3">
            <Card className="p-0 overflow-hidden shadow-xl rounded-2xl">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader />
                </div>
              ) : error ? (
                <div className="text-red-500 text-center py-8">{error}</div>
              ) : !visit ? (
                <div className="text-gray-500 text-center py-8">Visit not found.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-8">
                  {/* --- Left column: Client/Status --- */}
                  <div className="space-y-8">
                    {/* Client Name */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <UserIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-base font-bold text-gray-600">Client Name</span>
                      </div>
                      <div className="ml-9">
                        <div className="text-base font-semibold text-gray-800">{visit?.client_name || 'N/A'}</div>
                      </div>
                    </div>
                    {/* Client Mobile */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <PhoneIcon className="w-4 h-4 text-green-600" />
                        <span className="text-base font-bold text-gray-600">Client Mobile</span>
                      </div>
                      <div className="ml-9">
                        <div className="text-base font-semibold text-gray-800">{visit?.client_mobile || 'N/A'}</div>
                      </div>
                    </div>
                    {/* Status */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <ClipboardDocumentListIcon className="w-4 h-4 text-purple-600" />
                        <span className="text-base font-bold text-gray-600">Status</span>
                      </div>
                      <div className="ml-9">
                        <StatusBadge status={visit?.visit_status} />
                      </div>
                    </div>
                  </div>
                  {/* --- Right column: Notes/Meta --- */}
                  <div className="space-y-8">
                    {/* Notes */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <DocumentTextIcon className="w-4 h-4 text-amber-600" />
                        <span className="text-base font-bold text-gray-600">Visit Notes</span>
                      </div>
                      <div className="ml-9">
                        <div className="text-base text-gray-800 bg-gray-50 p-3 rounded-md min-h-[40px]">{visit?.visit_notes || 'No notes.'}</div>
                      </div>
                    </div>
                    {/* Created At */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon className="w-4 h-4 text-gray-600" />
                        <span className="text-base font-bold text-gray-600">Created At</span>
                      </div>
                      <div className="ml-9">
                        <div className="text-base font-semibold text-gray-800">{FORMATDATE(visit?.created_at, 3)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
} 