import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Hashids from 'hashids';
import Head from 'next/head';
import axiosInstance from '../../utils/axiosInstance';

// Components
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import Breadcrumb from '../../components/ui/Breadcrumb';
import CheckPermission from '../../components/ui/CkeckPermission';

// Redux
import {
  fetchPropertyById,
  selectCurrentProperty,
  selectPropertyLoading,
  selectPropertyError,
  clearPropertyError,
  clearCurrentProperty,
} from '../../store/slices/propertiesSlice';

import {
  BuildingOfficeIcon as BuildingOfficeSolid,
  CurrencyDollarIcon as CurrencyDollarSolid,
  UserIcon as UserSolid,
  MapPinIcon as MapPinSolid,
  HeartIcon as HeartSolid,
} from '@heroicons/react/24/solid';
import {
  BuildingOfficeIcon,
  UserIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  CalendarIcon,
  HomeIcon,
  BanknotesIcon,
  UserGroupIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  StarIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  ArrowTopRightOnSquareIcon,
  BuildingStorefrontIcon,
  HomeModernIcon,
  BuildingLibraryIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';

export default function PropertyDetailPage() {
  const router = useRouter();
  const { hashid } = router.query;
  const dispatch = useDispatch();
  const property = useSelector(selectCurrentProperty);
  const loading = useSelector(selectPropertyLoading);
  const error = useSelector(selectPropertyError);
  
  const hashids = new Hashids('your-salt-string', 6);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (property) {
      setIsSaved(property.is_saved || false);
    }
  }, [property]);

  useEffect(() => {
    if (!hashid) return;
    const id = hashids.decode(hashid)[0];
    if (!id) return;
    dispatch(fetchPropertyById(id));
    return () => {
      dispatch(clearCurrentProperty());
      dispatch(clearPropertyError());
    };
  }, [hashid, dispatch]);

  const handleSaveToggle = async () => {
    try {
        const id = hashids.decode(hashid)[0];
        if (!id) return;

        const response = await axiosInstance.post(`/api/property/${id}/save`);
        if(response.data.status){
            setIsSaved(response.data.saved);
        }
    } catch (error) {
        console.error('Error saving property:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share && property) {
      try {
        await navigator.share({
          title: property.property_name,
          text: `Check out this property: ${property.property_name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  // Helper to embed YouTube or show link for other videos
  const renderVideo = (videoLink) => {
    if (!videoLink) return null;
    // YouTube embed
    const ytMatch = videoLink.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    if (ytMatch) {
      return (
        <div className="aspect-video rounded-xl overflow-hidden shadow-lg border border-gray-200">
          <iframe
            src={`https://www.youtube.com/embed/${ytMatch[1]}`}
            title="Property Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      );
    }
    // Other video link
    return (
      <a
        href={videoLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
      >
        <VideoCameraIcon className="h-5 w-5" />
        Watch Video
        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
      </a>
    );
  };

  // Get property type icon
  const getPropertyTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'apartment':
        return <BuildingOffice2Icon className="h-6 w-6" />;
      case 'house':
        return <HomeIcon className="h-6 w-6" />;
      case 'villa':
        return <HomeModernIcon className="h-6 w-6" />;
      case 'commercial':
        return <BuildingStorefrontIcon className="h-6 w-6" />;
      case 'office':
        return <BuildingOfficeIcon className="h-6 w-6" />;
      default:
        return <BuildingLibraryIcon className="h-6 w-6" />;
    }
  };

  return (
    <>
      <Head>
        <title>{property ? property.property_name : 'Property Details'} | PMS</title>
      </Head>
      <div className="container-responsive animate-fade-in">
        {/* Hero Section with Breadcrumb */}
        <div className="relative mb-8">
          <div className="absolute inset-0 h-40 bg-gradient-to-r from-primary-100 via-accent-50 to-white rounded-3xl blur-sm opacity-80 -z-10" />
          <div className="flex items-center justify-between py-8">
            <Breadcrumb
              items={[
                { label: 'Properties', href: '/properties' },
                { label: property?.property_name || 'Property', icon: BuildingOfficeIcon },
              ]}
              backButtonText="Properties"
              backButtonHref="/properties"
            />
            {property && (
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={handleSaveToggle}
                >
                  {isSaved ? (
                    <HeartSolid className="h-4 w-4 text-red-500" />
                  ) : (
                    <HeartIcon className="h-4 w-4" />
                  )}
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={handleShare}
                >
                  <ShareIcon className="h-4 w-4" />
                  {isCopied ? 'Copied!' : 'Share'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Image Section */}
        {!loading && !error && property && (
          <div className="mb-8">
            {property.property_image ? (
              <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl bg-gray-100">
                <img
                  src={property.property_image}
                  alt={property.property_name}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center justify-between">
                    <div className="text-white">
                      <h1 className="text-3xl font-bold mb-2">{property.property_name}</h1>
                      <div className="flex items-center gap-4 text-white/90">
                        <div className="flex items-center gap-2">
                          <MapPinSolid className="h-5 w-5" />
                          <span>{property.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BuildingOfficeSolid className="h-5 w-5" />
                          <span>{property.property_type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-white">
                      <div className="text-2xl font-bold">₹{parseFloat(property.full_deal_amount).toLocaleString('en-IN')}</div>
                      <div className="text-white/80 text-sm">Deal Amount</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <BuildingOfficeIcon className="h-24 w-24 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No image available</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Sidebar - Quick Actions & Status */}
          <div className="xl:col-span-1 space-y-4">
            {/* Property Status Card */}
            <Card className="p-5 bg-gradient-to-br from-primary-50 via-white to-primary-100 border border-primary-200 shadow-soft">
              {loading ? (
                <Loader />
              ) : error ? (
                <div className="text-red-500 text-center">{error}</div>
              ) : property ? (
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                    {getPropertyTypeIcon(property.property_type)}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{property.property_name}</h2>
                  <Badge variant="primary" size="lg" className="mb-3">{property.property_type}</Badge>
                  
                  {/* Property Code - Only unique info not shown elsewhere */}
                  <div className="mt-6">
                    <Badge variant="primary" size="lg" className="mb-3 text-lg px-4 py-2">
                      <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                      {property.property_code}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center">Property not found</div>
              )}
            </Card>

            {/* Quick Actions Card */}
            {!loading && !error && property && (
              <Card className="p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <StarIcon className="h-4 w-4 text-yellow-500" />
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <CheckPermission permission="property-edit">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full flex items-center gap-2 text-sm"
                      onClick={() => router.push(`/properties/edit/${hashid}`)}
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                      Edit Property
                    </Button>
                  </CheckPermission>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full flex items-center gap-2 text-sm"
                    onClick={() => router.push(`/visits`)}
                  >
                    <EyeIcon className="h-4 w-4" />
                    View Visits
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full flex items-center gap-2 text-sm"
                    onClick={() => router.push(`/reports`)}
                  >
                    <DocumentTextIcon className="h-4 w-4" />
                    Generate Report
                  </Button>
                </div>
              </Card>
            )}

            {/* Property Status Card */}
            {!loading && !error && property && (
              <Card className="p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-blue-500" />
                  Property Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Status</span>
                    <Badge variant="success" size="sm">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Last Updated</span>
                    <span className="font-semibold text-gray-900 text-sm">
                      {property.created_at ? new Date(property.created_at).toLocaleDateString('en-IN') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Days Listed</span>
                    <span className="font-semibold text-gray-900 text-sm">
                      {property.created_at ? Math.floor((new Date() - new Date(property.created_at)) / (1000 * 60 * 60 * 24)) : 0}
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Main Content Area */}
          <div className="xl:col-span-3 space-y-5">
            {/* Deal Information */}
            <Card className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CurrencyDollarSolid className="h-5 w-5 text-success-600" />
                Deal Information
              </h3>
              
              {loading ? (
                <div className="flex justify-center items-center h-64"><Loader /></div>
              ) : error ? (
                <div className="text-red-500 text-center py-8">{error}</div>
              ) : !property ? (
                <div className="text-gray-500 text-center py-8">Property not found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Deal Amount */}
                  <div className="bg-gradient-to-br from-success-50 to-success-100 p-4 rounded-xl border border-success-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                        <BanknotesIcon className="h-4 w-4 text-success-700" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">Deal Amount</h4>
                        <p className="text-xs text-gray-600">Total transaction value</p>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-success-700">
                      ₹{parseFloat(property.full_deal_amount).toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Agent Information */}
                  <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-4 rounded-xl border border-primary-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <UserGroupIcon className="h-4 w-4 text-primary-700" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">Agent</h4>
                        <p className="text-xs text-gray-600">Handling this deal</p>
                      </div>
                    </div>
                    <div className="text-base font-semibold text-gray-900">{property.agent_code}</div>
                  </div>
                </div>
              )}
            </Card>

            {/* Contact Information */}
            <Card className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <UserSolid className="h-5 w-5 text-primary-600" />
                Contact Information
              </h3>
              
              {!loading && !error && property && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Seller Information */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-blue-700" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">Seller</h4>
                        <p className="text-xs text-gray-600">Property owner</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-base font-semibold text-gray-900">{property.seller_name}</div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <PhoneIcon className="h-3 w-3" />
                        <span className="text-xs">{property.seller_mobile}</span>
                      </div>
                    </div>
                  </div>

                  {/* Buyer Information */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-green-700" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">Buyer</h4>
                        <p className="text-xs text-gray-600">Property purchaser</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-base font-semibold text-gray-900">{property.buyer_name || 'Not assigned'}</div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <PhoneIcon className="h-3 w-3" />
                        <span className="text-xs">{property.buyer_mobile || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Property Details */}
            <Card className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <BuildingOfficeSolid className="h-5 w-5 text-gray-600" />
                Property Details
              </h3>
              
              {!loading && !error && property && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <BuildingOfficeIcon className="h-4 w-4 text-gray-600" />
                      <span className="font-semibold text-gray-900 text-sm">Property Type</span>
                    </div>
                    <div className="text-base text-gray-700">{property.property_type}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <HomeIcon className="h-4 w-4 text-gray-600" />
                      <span className="font-semibold text-gray-900 text-sm">Property Size</span>
                    </div>
                    <div className="text-base text-gray-700">{property.property_size} sqft</div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <BuildingOffice2Icon className="h-4 w-4 text-gray-600" />
                      <span className="font-semibold text-gray-900 text-sm">Number of Units</span>
                    </div>
                    <div className="text-base text-gray-700">{property.number_of_units}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <CurrencyDollarIcon className="h-4 w-4 text-gray-600" />
                      <span className="font-semibold text-gray-900 text-sm">Rate per sqft</span>
                    </div>
                    <div className="text-base text-gray-700">₹{property.property_rate}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPinSolid className="h-4 w-4 text-gray-600" />
                      <span className="font-semibold text-gray-900 text-sm">Location</span>
                    </div>
                    <div className="text-base text-gray-700">{property.city}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <ClockIcon className="h-4 w-4 text-gray-600" />
                      <span className="font-semibold text-gray-900 text-sm">Created Date</span>
                    </div>
                    <div className="text-base text-gray-700">
                      {property.created_at ? new Date(property.created_at).toLocaleDateString('en-IN') : 'N/A'}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Attachments and Media */}
            {!loading && !error && property && (property.property_brochure || property.video_link) && (
              <Card className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                  Documents & Media
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Brochure */}
                  {property.property_brochure && (
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <DocumentTextIcon className="h-4 w-4 text-purple-700" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">Property Brochure</h4>
                          <p className="text-xs text-gray-600">Download property details</p>
                        </div>
                      </div>
                      <a
                        href={property.property_brochure}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-2 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs"
                      >
                        <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                        View Brochure
                      </a>
                    </div>
                  )}

                  {/* Video */}
                  {property.video_link && (
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <VideoCameraIcon className="h-4 w-4 text-red-700" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">Property Video</h4>
                          <p className="text-xs text-gray-600">Watch property tour</p>
                        </div>
                      </div>
                      {renderVideo(property.video_link)}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}