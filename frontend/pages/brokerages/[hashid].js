import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Hashids from 'hashids';
import Head from 'next/head';

// Redux
import { 
  fetchBrokerageById,
  selectCurrentBrokerage,
  selectBrokerageLoading,
  selectBrokerageError,
  clearBrokerageError,
  clearCurrentBrokerage
} from '../../store/slices/brokeragesSlice';

// Components
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { PAYMENT_MODES } from '../../utils/constants';

import { 
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UserIcon,
  UserGroupIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const hashids = new Hashids('your-salt-string', 6);
export default function BrokerageDetailPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { hashid } = router.query;
  
  const brokerage = useSelector(selectCurrentBrokerage);
  const loading = useSelector(selectBrokerageLoading);
  const error = useSelector(selectBrokerageError);

  useEffect(() => {
    if (hashid) {
      try {
        const decodedId = hashids.decode(hashid)[0];
        if (decodedId) {
          dispatch(fetchBrokerageById(decodedId));
        } else {
          toast.error('Invalid brokerage ID');
          router.push('/brokerages');
        }
      } catch (error) {
        toast.error('Invalid brokerage ID');
        router.push('/brokerages');
      }
    }
  }, [hashid, dispatch, router]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearBrokerageError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearCurrentBrokerage());
    };
  }, [dispatch]);

  const handleBack = () => {
    router.push('/brokerages');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!brokerage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Brokerage Not Found</h2>
          <Button onClick={handleBack} variant="primary">
            Back to Brokerages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{brokerage ? `Brokerage ${brokerage.brokerage_code}` : 'Brokerage Details'} | PMS</title>
      </Head>
      <div className="container-responsive animate-fade-in">
        {/* Page Header with Icon and Accent */}
        <div className="relative mb-10">
          <div className="absolute inset-0 h-32 bg-gradient-to-r from-primary-100 via-accent-50 to-white rounded-2xl blur-sm opacity-80 -z-10" />
          <div className="flex items-center gap-4 py-6">
            <Breadcrumb
              items={[
                { label: 'Brokerages', href: '/brokerages' },
                { label: `Brokerage ${brokerage.brokerage_code}`, icon: CurrencyDollarIcon }
              ]}
              backButtonText="Brokerages"
              backButtonHref="/brokerages"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left: Brokerage Code & Basic Info */}
          <div className="xl:col-span-1">
            <Card className="flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 p-8 border border-gray-100 shadow-soft">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <CurrencyDollarIcon className="w-12 h-12 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">Brokerage</div>
            <Badge variant="primary" size="lg" className="mb-6 text-lg px-4 py-2">
              <CurrencyDollarIcon className="w-4 h-4 mr-2" />
              {brokerage.brokerage_code}
            </Badge>
            <div className="text-3xl font-bold text-primary-600 mb-2">
              ₹{parseFloat(brokerage.total_brokerage).toLocaleString('en-IN')}
            </div>
            <div className="text-sm text-gray-500 text-center mb-6">Total Brokerage Amount</div>
            
            {/* Payment Mode Badge */}
            <div className="w-full">
              <Badge 
                variant={brokerage.mode_of_payment === 'cash' ? 'success' : brokerage.mode_of_payment === 'bank_transfer' ? 'primary' : 'secondary'}
                size="md"
                className="w-full justify-center"
              >
                <CreditCardIcon className="w-4 h-4 mr-2" />
                {PAYMENT_MODES.find(m => m.value === brokerage.mode_of_payment)?.label || brokerage.mode_of_payment}
              </Badge>
            </div>
          </Card>
          </div>

          {/* Middle: Details */}
          <div className="xl:col-span-3">
            <Card className="p-0 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-8">
              {/* Left column: Property, Agent, Manager */}
              <div className="space-y-8">
                {/* Property Details Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
                      <BuildingOfficeIcon className="w-4 h-4 text-indigo-500" />
                    </div>
                    <span className="text-base font-bold text-gray-600">Property Details</span>
                  </div>
                  <div className="ml-9">
                    <div className="text-xs text-gray-500 mb-1">{brokerage.property_name}</div>
                    <Badge variant="secondary" size="sm" className="mb-2">
                      <BuildingOfficeIcon className="w-3 h-3 mr-1" />
                      {brokerage.property_code}
                    </Badge>
                  </div>
                </div>
                {/* Agent Details Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="text-base font-bold text-gray-600">Agent Details</span>
                  </div>
                  <div className="ml-9">
                    <div className="text-xs text-gray-500 mb-1">{brokerage.agent_name}</div>
                    <Badge variant="success" size="sm" className="mb-2">
                      <UserIcon className="w-3 h-3 mr-1" />
                      {brokerage.agent_code}
                    </Badge>
                  </div>
                </div>
                {/* Manager Details Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center">
                      <UserGroupIcon className="w-4 h-4 text-purple-500" />
                    </div>
                    <span className="text-base font-bold text-gray-600">Manager Details</span>
                  </div>
                  <div className="ml-9">
                    <div className="text-xs text-gray-500 mb-1">{brokerage.manager_name}</div>
                    <Badge variant="warning" size="sm" className="mb-2">
                      <UserGroupIcon className="w-3 h-3 mr-1" />
                      {brokerage.manager_code}
                    </Badge>
                  </div>
                </div>
              </div>
              {/* Right column: Commission, Timeline */}
              <div className="space-y-8">
                {/* Commission Details Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                      <CurrencyDollarIcon className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="text-base font-bold text-gray-600">Commission Details</span>
                  </div>
                  <div className="ml-9 space-y-2">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Agent Commission</div>
                      <div className="font-semibold text-green-600 text-lg">
                        ₹{parseFloat(brokerage.agent_commission).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Manager Commission</div>
                      <div className="font-semibold text-orange-500 text-lg">
                        ₹{parseFloat(brokerage.manager_commission_value).toLocaleString('en-IN')}
                        {brokerage.manager_commission_type === 'percent' && (
                          <span className="text-xs text-gray-500 ml-2">({brokerage.manager_commission_value}%)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Timeline Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-violet-100 rounded-full flex items-center justify-center">
                      <CalendarIcon className="w-4 h-4 text-violet-500" />
                    </div>
                    <span className="text-base font-bold text-gray-600">Timeline</span>
                  </div>
                  <div className="ml-9 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Created:</span>
                      <span className="font-semibold text-gray-800">{new Date(brokerage.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Updated:</span>
                      <span className="font-semibold text-gray-800">{new Date(brokerage.updated_at).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          </div>

          {/* Summary Cards */}
          <div className="xl:col-span-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Brokerage</div>
                    <div className="text-2xl font-bold text-green-600">
                      ₹{parseFloat(brokerage.total_brokerage).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Agent Commission</div>
                    <div className="text-2xl font-bold text-blue-600">
                      ₹{parseFloat(brokerage.agent_commission).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <UserGroupIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Manager Commission</div>
                    <div className="text-2xl font-bold text-purple-600">
                      ₹{parseFloat(brokerage.manager_commission_value).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Additional Information */}
          {brokerage.notes && (
            <div className="xl:col-span-4">
              <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="w-5 h-5 text-amber-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Additional Notes</h2>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-amber-200">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{brokerage.notes}</p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 