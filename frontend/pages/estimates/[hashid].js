import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Hashids from 'hashids';
import Head from 'next/head';
import axiosInstance from '../../utils/axiosInstance';
import { FORMATCURRENCY } from '../../utils/constants';

// Components
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import Breadcrumb from '../../components/ui/Breadcrumb';

import { 
  CalculatorIcon, 
  BuildingOfficeIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
  ClockIcon,
  UserIcon,
  HomeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function EstimateDetailPage() {
  const router = useRouter();
  const { hashid } = router.query;
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hashids = new Hashids('your-salt-string', 6);
  const id = hashids.decode(hashid)[0];

  useEffect(() => {
    if (id) {
      fetchEstimate();
    }
  }, [id]);

  const fetchEstimate = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/estimates/${id}`);
      setEstimate(response.data.estimate);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch estimate details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{estimate ? `Estimate ${estimate.property_code}` : 'Estimate Details'} | PMS</title>
      </Head>
      <div className="container-responsive animate-fade-in">
        {/* Page Header with Icon and Accent */}
        <div className="relative mb-10">
          <div className="absolute inset-0 h-32 bg-gradient-to-r from-primary-100 via-accent-50 to-white rounded-2xl blur-sm opacity-80 -z-10" />
          <div className="flex items-center gap-4 py-6">
            <Breadcrumb
              items={[
                { label: 'Estimates', href: '/estimates' },
                { label: estimate?.property_code || 'Estimate', icon: CalculatorIcon }
              ]}
              backButtonText="Estimates"
              backButtonHref="/estimates"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left: Basic Info */}
          <div className="xl:col-span-1">
            <Card className="flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 p-8 border border-gray-100 shadow-soft">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mb-4">
                <CalculatorIcon className="h-8 w-8 text-white" />
              </div>
              <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Badge variant="primary" size="sm">
                <UserIcon className="w-3 h-3 mr-1" />
                <span>{estimate?.agent_code}</span>
              </Badge>
              </div>
              <div className="text-xl font-bold text-gray-800 mb-2">{estimate?.property_code}</div>
              <Badge variant="success" size="md" className="mb-2">
                {estimate?.status || 'N/A'}
              </Badge>
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <CurrencyRupeeIcon className="h-5 w-5" />
                <span className="font-semibold">{FORMATCURRENCY(estimate?.total)}</span>
              </div>
              <div className="mt-2">
                <Badge variant="secondary" size="sm">
                  <ClockIcon className="w-3 h-3 mr-1" />
                  {estimate?.created_at ? new Date(estimate.created_at).toLocaleDateString("en-IN") : 'N/A'}
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
              ) : !estimate ? (
                <div className="text-gray-500 text-center py-8">Estimate not found.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-8">
                  {/* Left column: Property Details */}
                  <div className="space-y-8">
                    {/* Property Size Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center">
                          <HomeIcon className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-base font-bold text-gray-600">Property Size</span>
                      </div>
                      <div className="ml-9">
                        <div className="text-xs text-gray-500 mb-1">Square Feet</div>
                        <div className="text-base font-semibold text-gray-800">
                          {estimate?.property_size ? parseFloat(estimate.property_size).toLocaleString() : 'N/A'} sq ft
                        </div>
                      </div>
                    </div>

                    {/* Property Rate Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center">
                          <CurrencyRupeeIcon className="w-4 h-4 text-teal-600" />
                        </div>
                        <span className="text-base font-bold text-gray-600">Property Rate</span>
                      </div>
                      <div className="ml-9">
                        <div className="text-xs text-gray-500 mb-1">Rate per Square Feet</div>
                        <div className="text-base font-semibold text-gray-800">
                          {FORMATCURRENCY(estimate?.property_rate)} /sq ft
                        </div>
                      </div>
                    </div>

                    {/* Total Brokerage Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                          <ChartBarIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-base font-bold text-gray-600">Total Brokerage</span>
                      </div>
                      <div className="ml-9">
                        <div className="text-xs text-gray-500 mb-1">Commission Amount</div>
                        <div className="text-base font-semibold text-green-700">
                          {FORMATCURRENCY(estimate?.total_brokerage)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right column: Calculation Details */}
                  <div className="space-y-8">
                    {/* Agent Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-base font-bold text-gray-600">Agent</span>
                      </div>
                      <div className="ml-9">
                        <div className="text-xs text-gray-500 mb-1">Agent Code</div>
                        <Badge variant="primary" size="sm" className="mb-2">
                          <UserIcon className="w-3 h-3 mr-1" />
                          {estimate?.agent_code || 'N/A'}
                        </Badge>
                      </div>
                    </div>

                    {/* Status Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center">
                          <DocumentTextIcon className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="text-base font-bold text-gray-600">Status</span>
                      </div>
                      <div className="ml-9">
                        <div className="text-xs text-gray-500 mb-1">Current Status</div>
                        <Badge variant="success" size="sm" className="mb-2">
                          <DocumentTextIcon className="w-3 h-3 mr-1" />
                          {estimate?.status || 'N/A'}
                        </Badge>
                      </div>
                    </div>

                    {/* Grand Total Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                          <CurrencyRupeeIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-base font-bold text-gray-600">Grand Total</span>
                      </div>
                      <div className="ml-9">
                        <div className="text-xs text-gray-500 mb-1">Final Amount</div>
                        <div className="text-lg font-bold text-gray-900">
                          {FORMATCURRENCY(estimate?.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Bottom: Summary Widgets */}
          <div className="xl:col-span-4 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card variant="elevated" className="flex items-center gap-4">
                <BuildingOfficeIcon className="h-10 w-10 text-accent-500 bg-accent-100 rounded-xl p-2" />
                <div>
                  <div className="text-lg font-bold text-gray-900">Property Management</div>
                  <div className="text-sm text-gray-500">Coming soon: Property details and management features</div>
                </div>
              </Card>
              <Card variant="elevated" className="flex items-center gap-4">
                <ChartBarIcon className="h-10 w-10 text-primary-500 bg-primary-100 rounded-xl p-2" />
                <div>
                  <div className="text-lg font-bold text-gray-900">Analytics & Reports</div>
                  <div className="text-sm text-gray-500">Coming soon: Detailed analytics and reporting features</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}