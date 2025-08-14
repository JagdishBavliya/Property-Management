import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { useRoleFlags } from '../hooks/useRoleFlags';
import { updateUser } from '../store/slices/authSlice';
import axiosInstance from '../utils/axiosInstance';
import Link from 'next/link';
import Hashids from 'hashids';

// Components
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import UserAvatar from '../components/ui/UserAvatar';
import CheckPermission from '../components/ui/CkeckPermission';
import LoadingSpinner from '../components/ui/LoadingSpinner';

import {
  UserIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, CalendarIcon,
  ShieldCheckIcon, PencilIcon, CameraIcon, CheckIcon, BuildingOfficeIcon,
  ChartBarIcon, ClockIcon, StarIcon, HomeIcon, BriefcaseIcon,
  SparklesIcon, HeartIcon, CurrencyDollarIcon, UsersIcon, CogIcon,
  BanknotesIcon, PresentationChartLineIcon,
} from '@heroicons/react/24/outline';

const ProfileInfoField = ({ isEditing, label, value, icon: Icon, colorClass, as = 'input', name, type = 'text', required = false, ...props }) => {
  const InputComponent = as;
  const inputClasses = "w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200 text-sm";
  
  if (as === 'textarea') props.rows = props.rows || 3;
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
        <Icon className={`h-4 w-4 ${colorClass}`} />
        {label}
        {required && isEditing && <span className="text-red-500 ml-1">*</span>}
      </label>
      {isEditing ? (
        <InputComponent
          name={name}
          type={type}
          defaultValue={value === 'Not provided' ? '' : value}
          className={`${inputClasses} ${as === 'textarea' ? 'resize-none' : ''}`}
          required={required}
          {...props}
        />
      ) : (
        <div className="w-full px-3 py-2 bg-gray-50 rounded-lg text-gray-800 font-medium text-sm min-h-[36px] flex items-center border border-gray-100">
          {as === 'textarea' ? <p className="whitespace-pre-wrap">{value}</p> : value}
        </div>
      )}
    </div>
  );
};

export default function Profile() {
  const { user } = useAuth();
  const { isAgent, isManager, isAdmin } = useRoleFlags();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [savedProperties, setSavedProperties] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const hashids = new Hashids('your-salt-string', 6);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Fetch user profile details
        const profileResponse = await axiosInstance.get(`/api/users/${user.id}`);
        if (profileResponse.data.status) {
          setUserProfile({
            ...profileResponse.data.user,
            roles: profileResponse.data.roles,
            permissions: profileResponse.data.permissions,
          });
        }
        // Fetch saved properties
        const propertiesResponse = await axiosInstance.get('/api/users/saved-properties');
        if (propertiesResponse.data.status) setSavedProperties(propertiesResponse.data.properties);
        await fetchRoleSpecificData();
        
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user?.id]);

  const fetchRoleSpecificData = async () => {
    try {
      if (isAgent) {
        setStats({
          propertiesManaged: 15,
          clientSatisfaction: 4.6,
          commissionsEarned: 75000,
          activeListings: 8,
        });
        setRecentActivity([
      {
        id: 1,
        type: 'property',
            message: 'Added new property listing',
        time: '2 hours ago',
        status: 'success',
        icon: HomeIcon,
        color: 'primary',
      },
      {
        id: 2,
        type: 'client',
            message: 'Scheduled property viewing',
        time: '4 hours ago',
        status: 'info',
        icon: UserIcon,
        color: 'secondary',
      },
        ]);
      } else if (isManager) {
        setStats({
          teamSize: 12,
          teamPerformance: 4.8,
          propertiesOversaw: 180,
          monthlyRevenue: 250000,
        });
        setRecentActivity([
          {
            id: 1,
            type: 'team',
            message: 'Approved new agent application',
            time: '1 hour ago',
            status: 'success',
            icon: UserIcon,
            color: 'primary',
          },
          {
            id: 2,
            type: 'report',
            message: 'Generated monthly performance report',
            time: '3 hours ago',
            status: 'info',
            icon: ChartBarIcon,
            color: 'secondary',
          },
        ]);
      } else if (isAdmin) {
        setStats({
          totalUsers: 150,
          systemUptime: 99.9,
          monthlyTransactions: 500,
          totalRevenue: 1200000,
        });
        setRecentActivity([
          {
            id: 1,
            type: 'system',
            message: 'Updated system configuration',
            time: '30 minutes ago',
        status: 'success',
            icon: CogIcon,
            color: 'primary',
          },
          {
            id: 2,
            type: 'user',
            message: 'Approved manager role assignment',
            time: '2 hours ago',
            status: 'info',
            icon: ShieldCheckIcon,
            color: 'secondary',
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching role-specific data:', error);
    }
  };

  const getIconColor = (color) => {
    const colors = {
      primary: 'text-primary-600',
      secondary: 'text-secondary-600',
      accent: 'text-accent-600',
      success: 'text-success-600',
      warning: 'text-warning-600',
      danger: 'text-danger-600',
    };
    return colors[color] || colors.primary;
  };

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Please upload a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axiosInstance.post(`/api/users/update-avatar/${user.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status) {
        setSuccessMessage('Profile picture updated successfully!');
        setUserProfile(prev => ({ ...prev, avatar: response.data.avatarUrl}));
        dispatch(updateUser({ avatar: response.data.avatarUrl }));
      } else {
        setErrorMessage(response.data.msg || 'Failed to update profile picture');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      setErrorMessage('Failed to update profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    if (!userProfile) return;

    setUpdateLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const formData = new FormData(event.target);
      const updateData = {
        name: formData.get('name') || userProfile.name,
        phone: formData.get('phone') || userProfile.phone,
      };

      const response = await axiosInstance.put(`/api/users/update-profile/${user.id}`, updateData);

      if (response.data.status) {
        setSuccessMessage('Profile updated successfully!');
        setUserProfile(prev => ({
          ...prev,
          ...updateData
        }));
        setIsEditing(false);
      } else {
        if (response.data.errors && Array.isArray(response.data.errors)) {
          const errorMessages = response.data.errors.map(err => err.msg).join(', ');
          setErrorMessage(errorMessages);
        } else {
          setErrorMessage(response.data.msg || 'Failed to update profile');
        }
      }
    } catch (error) {
      console.error('Profile update error:', error);
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
        setErrorMessage(errorMessages);
      } else {
        setErrorMessage('Failed to update profile. Please try again.');
      }
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile not found</h2>
          <p className="text-gray-600">Unable to load profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                <p className="mt-1 text-sm text-gray-600">
                  {isAgent ? 'View your profile information and update your profile picture' : 'Manage your personal information and account settings'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!isAgent && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={PencilIcon}
                    onClick={() => setIsEditing(!isEditing)}
                    className="w-full sm:w-auto"
                  >
                    {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                  </Button>
                  {isEditing && (
                    <Button
                      type="submit"
                      form="profile-form"
                      variant="primary"
                      icon={CheckIcon}
                      className="w-full sm:w-auto"
                      disabled={updateLoading}
                    >
                      {updateLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  )}
                </>
              )}
              {isAgent && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">View Only Profile</p>
                  <p className="text-xs text-gray-500">You can update your profile picture only</p>
                </div>
              )}
            </div>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckIcon className="h-5 w-5 text-success-600 flex-shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}
          
          {errorMessage && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <svg className="h-5 w-5 text-danger-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Info */}
            <div className="lg:col-span-2 space-y-4">
              {/* Profile Header Card */}
              <Card variant="elevated" className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-500/5"></div>
                <div className="relative px-2 py-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    {/* Avatar Section */}
                    <div className="relative flex-shrink-0">
                      <div className="rounded-full border-2 border-gray-200 shadow-md p-1 bg-white">
                        <UserAvatar user={userProfile} size="xl" showStatus={true} />
                      </div>
                      {(isEditing || isAgent) && (
                        <label className="absolute -bottom-1 -right-1 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 group border border-primary-200 hover:border-primary-300">
                          <CameraIcon className="h-4 w-4 text-primary-600 group-hover:text-primary-700" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                            disabled={isUploading}
                          />
                        </label>
                      )}
                    </div>
                    
                    {/* Profile Information Section */}
                    <div className="flex-1 min-w-0 space-y-4">
                      {/* Name and Title */}
                      <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                          {userProfile.name}
                        </h2>
                        
                        {/* Role and Code Badges */}
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-900 border border-primary-200 shadow-sm">
                            <SparklesIcon className="h-4 w-4 mr-1.5" />
                            {user?.role}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-900 border border-primary-200 shadow-sm">
                            <UserIcon className="h-4 w-4 mr-1" />
                            {userProfile.user_code || 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Contact and Join Information */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                          <CalendarIcon className="h-4 w-4 text-primary-600 flex-shrink-0" />
                          <span className="font-medium">Joined {new Date(userProfile.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                        
                        {userProfile.phone && (
                          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                            <PhoneIcon className="h-4 w-4 text-secondary-600 flex-shrink-0" />
                            <span className="font-medium">{userProfile.phone}</span>
                          </div>
                        )}
                        
                        {userProfile.email && (
                          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                            <EnvelopeIcon className="h-4 w-4 text-accent-600 flex-shrink-0" />
                            <span className="font-medium">{userProfile.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Personal Information */}
              <Card title="Personal Information" variant="elevated">
                <form id="profile-form" onSubmit={handleProfileUpdate}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <ProfileInfoField
                        isEditing={isAgent ? false : isEditing}
                        label="Full Name"
                        value={userProfile.name}
                        icon={UserIcon}
                        colorClass="text-primary-600"
                        name="name"
                        required
                      />
                      <ProfileInfoField
                        isEditing={false}
                        label="Email Address"
                        value={userProfile.email}
                        icon={EnvelopeIcon}
                        colorClass="text-secondary-600"
                      />
                      <ProfileInfoField
                        isEditing={isAgent ? false : isEditing}
                        label="Phone Number"
                        value={userProfile.phone || 'Not provided'}
                        icon={PhoneIcon}
                        colorClass="text-accent-600"
                        name="phone"
                        type="tel"
                      />
                    </div>
                    <div className="space-y-3">
                      <ProfileInfoField
                        isEditing={false}
                        label="User Code"
                        value={userProfile.user_code || 'N/A'}
                        icon={UserIcon}
                        colorClass="text-warning-600"
                      />
                      <ProfileInfoField
                        isEditing={false}
                        label="Joined Date"
                        value={new Date(userProfile.created_at).toLocaleDateString()}
                        icon={CalendarIcon}
                        colorClass="text-success-600"
                      />
                    </div>
                  </div>
                </form>
              </Card>

                            {/* Role-Specific Information */}
              {isAgent && (
                <Card title="Agent Information" variant="elevated">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      {userProfile.agent_type && (
                        <ProfileInfoField
                          isEditing={false}
                          label="Agent Type"
                          value={userProfile.agent_type}
                          icon={BriefcaseIcon}
                          colorClass="text-primary-600"
                        />
                      )}
                      {userProfile.agent_salary && (
                        <ProfileInfoField
                          isEditing={false}
                          label="Base Salary"
                          value={`₹${parseFloat(userProfile.agent_salary).toLocaleString('en-IN')}`}
                          icon={CurrencyDollarIcon}
                          colorClass="text-secondary-600"
                        />
                      )}
                      {userProfile.commission && (
                        <ProfileInfoField
                          isEditing={false}
                          label="Commission Rate"
                          value={`${userProfile.commission}% (${userProfile.commission_type})`}
                          icon={PresentationChartLineIcon}
                          colorClass="text-accent-600"
                        />
                      )}
                    </div>
                    <div className="space-y-3">
                      {userProfile.manager_code && (
                        <ProfileInfoField
                          isEditing={false}
                          label="Manager Code"
                          value={userProfile.manager_code}
                          icon={UserIcon}
                          colorClass="text-warning-600"
                        />
                      )}
                      {userProfile.balance !== undefined && (
                        <ProfileInfoField
                          isEditing={false}
                          label="Account Balance"
                          value={`₹${parseFloat(userProfile.balance).toLocaleString('en-IN')}`}
                          icon={BanknotesIcon}
                          colorClass="text-success-600"
                        />
                      )}
                      {userProfile.overdraft !== undefined && (
                        <ProfileInfoField
                          isEditing={false}
                          label="Overdraft Limit"
                          value={`₹${parseFloat(userProfile.overdraft).toLocaleString('en-IN')}`}
                          icon={CurrencyDollarIcon}
                          colorClass="text-danger-600"
                        />
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {isManager && (
                <Card title="Manager Information" variant="elevated">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      {userProfile.manager_code && (
                        <ProfileInfoField
                          isEditing={false}
                          label="Manager Code"
                          value={userProfile.manager_code}
                          icon={ShieldCheckIcon}
                          colorClass="text-primary-600"
                        />
                      )}
                      {userProfile.admin_code && (
                        <ProfileInfoField
                          isEditing={false}
                          label="Admin Code"
                          value={userProfile.admin_code}
                          icon={UserIcon}
                          colorClass="text-secondary-600"
                        />
                      )}
                    </div>
                  </div>
                </Card>
              )}



              {/* Saved Properties */}
              {savedProperties.length > 0 && (
              <Card title="Saved Properties" variant="elevated">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedProperties.map((property) => (
                      <Link href={`/properties/${hashids.encode(property.id)}`} key={property.id} className="group">
                         <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 overflow-hidden border border-gray-100">
                              <div className="relative">
                                  <div className="w-full h-32 bg-gray-200">
                                      <img 
                                          src={property.property_image} 
                                          alt={property.property_name}
                                          className="w-full h-full object-cover"
                                      />
                                  </div>
                                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm">
                                      <HeartIcon className="w-4 h-4 text-red-500" />
                                  </div>
                              </div>
                              <div className="p-3">
                                  <h4 className="font-semibold text-sm text-gray-800 truncate group-hover:text-primary-600 transition-colors">
                                      {property.property_name}
                                  </h4>
                                  <div className="flex items-center text-gray-500 mt-1.5">
                                      <MapPinIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                                      <p className="text-xs truncate">{property.city}</p>
                                  </div>
                                  <div className="mt-2.5 flex justify-between items-center">
                                      <p className="text-lg font-bold text-primary-700">
                                          ₹{parseFloat(property.full_deal_amount).toLocaleString('en-IN')}
                                      </p>
                                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                                          {property.property_type}
                                      </span>
                                  </div>
                              </div>
                          </div>
                      </Link>
                  ))}
                  </div>
              </Card>
              )}
            </div>

            {/* Right Column - Stats & Activity */}
            <div className="space-y-4">
              {/* Performance Stats */}
              {stats && (
                <Card title={`${user?.role} Statistics`} variant="elevated">
                  <div className="space-y-2">
                    {isAgent && (
                      <>
                        <div className="group p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-600 rounded-lg shadow-sm">
                              <BuildingOfficeIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Properties Managed</p>
                              <p className="text-xl font-bold text-gray-900">{stats.propertiesManaged}</p>
                      </div>
                    </div>
                  </div>
                  
                        <div className="group p-3 bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-lg border border-secondary-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-secondary-600 rounded-lg shadow-sm">
                              <CurrencyDollarIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                              <p className="text-sm font-semibold text-gray-600">Commissions Earned</p>
                              <p className="text-xl font-bold text-gray-900">₹{stats.commissionsEarned?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                  
                        <div className="group p-3 bg-gradient-to-r from-accent-50 to-accent-100 rounded-lg border border-accent-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent-600 rounded-lg shadow-sm">
                              <StarIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Client Satisfaction</p>
                              <p className="text-xl font-bold text-gray-900">{stats.clientSatisfaction}/5.0</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="group p-3 bg-gradient-to-r from-success-50 to-success-100 rounded-lg border border-success-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-success-600 rounded-lg shadow-sm">
                              <HomeIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-600">Active Listings</p>
                              <p className="text-xl font-bold text-gray-900">{stats.activeListings}</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {isManager && (
                      <>
                        <div className="group p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-600 rounded-lg shadow-sm">
                              <UsersIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-600">Team Size</p>
                              <p className="text-xl font-bold text-gray-900">{stats.teamSize}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="group p-3 bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-lg border border-secondary-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-secondary-600 rounded-lg shadow-sm">
                              <ChartBarIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-600">Team Performance</p>
                              <p className="text-xl font-bold text-gray-900">{stats.teamPerformance}/5.0</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="group p-3 bg-gradient-to-r from-accent-50 to-accent-100 rounded-lg border border-accent-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent-600 rounded-lg shadow-sm">
                              <BuildingOfficeIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-600">Properties Oversaw</p>
                              <p className="text-xl font-bold text-gray-900">{stats.propertiesOversaw}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="group p-3 bg-gradient-to-r from-success-50 to-success-100 rounded-lg border border-success-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-success-600 rounded-lg shadow-sm">
                              <CurrencyDollarIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-600">Monthly Revenue</p>
                              <p className="text-xl font-bold text-gray-900">₹{stats.monthlyRevenue?.toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {isAdmin && (
                      <>
                        <div className="group p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-600 rounded-lg shadow-sm">
                              <UsersIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-600">Total Users</p>
                              <p className="text-xl font-bold text-gray-900">{stats.totalUsers}</p>
                      </div>
                    </div>
                  </div>
                  
                        <div className="group p-3 bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-lg border border-secondary-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-secondary-600 rounded-lg shadow-sm">
                              <ClockIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                              <p className="text-sm font-semibold text-gray-600">System Uptime</p>
                              <p className="text-xl font-bold text-gray-900">{stats.systemUptime}%</p>
                      </div>
                          </div>
                        </div>
                        
                        <div className="group p-3 bg-gradient-to-r from-accent-50 to-accent-100 rounded-lg border border-accent-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent-600 rounded-lg shadow-sm">
                              <ChartBarIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-600">Monthly Transactions</p>
                              <p className="text-xl font-bold text-gray-900">{stats.monthlyTransactions}</p>
                    </div>
                  </div>
                </div>
                        
                        <div className="group p-3 bg-gradient-to-r from-success-50 to-success-100 rounded-lg border border-success-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-success-600 rounded-lg shadow-sm">
                              <CurrencyDollarIcon className="h-4 w-4 text-white" />
                      </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-600">Total Revenue</p>
                              <p className="text-xl font-bold text-gray-900">₹{stats.totalRevenue?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                </div>
                      </>
                    )}
                </div>
              </Card>
              )}

              {/* Quick Actions */}
              <Card title="Quick Actions" variant="elevated">
                <div className="grid gap-2">
                  {/* Always visible actions */}
                  <div 
                    className="group p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                    onClick={() => setIsEditing(true)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 p-2 bg-primary-600 rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-200">
                        <PencilIcon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                        Edit Profile
                        </h4>
                        <p className="text-xs text-gray-500">
                          Update information
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Agent Quick Actions */}
                  {isAgent && (
                    <>
                      <CheckPermission permission="property-list" fallback={null}>
                        <Link href="/properties">
                          <div className="group p-3 bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-lg border border-secondary-200 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 p-2 bg-secondary-600 rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-200">
                                <BuildingOfficeIcon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-secondary-700 transition-colors">
                                  My Properties
                                </h4>
                                <p className="text-xs text-gray-500">
                                  Manage listings
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </CheckPermission>
                      
                      <CheckPermission permission="visit-list" fallback={null}>
                        <Link href="/visits">
                          <div className="group p-3 bg-gradient-to-r from-accent-50 to-accent-100 rounded-lg border border-accent-200 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 p-2 bg-accent-600 rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-200">
                                <CalendarIcon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-accent-700 transition-colors">
                                  My Visits
                                </h4>
                                <p className="text-xs text-gray-500">
                                  Track visits
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </CheckPermission>
                      
                      <CheckPermission permission="estimate-list" fallback={null}>
                        <Link href="/estimates">
                          <div className="group p-3 bg-gradient-to-r from-success-50 to-success-100 rounded-lg border border-success-200 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 p-2 bg-success-600 rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-200">
                                <PresentationChartLineIcon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-success-700 transition-colors">
                                  My Estimates
                                </h4>
                                <p className="text-xs text-gray-500">
                                  Create estimates
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </CheckPermission>
                    </>
                  )}

                  {/* Manager Quick Actions */}
                  {isManager && (
                    <>
                      <CheckPermission permission="agent-list" fallback={null}>
                        <Link href="/agents">
                          <div className="group p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 p-2 bg-blue-600 rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-200">
                                <UsersIcon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                  Manage Agents
                                </h4>
                                <p className="text-xs text-gray-500">
                                  Team oversight
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </CheckPermission>
                      
                      <CheckPermission permission="report-list" fallback={null}>
                        <Link href="/reports">
                          <div className="group p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 p-2 bg-purple-600 rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-200">
                                <ChartBarIcon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                                  Team Reports
                                </h4>
                                <p className="text-xs text-gray-500">
                                  Performance metrics
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </CheckPermission>
                      
                      <CheckPermission permission="property-list" fallback={null}>
                        <Link href="/properties">
                          <div className="group p-3 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 p-2 bg-indigo-600 rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-200">
                                <BuildingOfficeIcon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                                  All Properties
                                </h4>
                                <p className="text-xs text-gray-500">
                                  Region properties
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </CheckPermission>
                    </>
                  )}

                  {/* Admin Quick Actions */}
                  {isAdmin && (
                    <>
                      <CheckPermission permission="admin-list" fallback={null}>
                        <Link href="/admins">
                          <div className="group p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 p-2 bg-red-600 rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-200">
                                <ShieldCheckIcon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-red-700 transition-colors">
                                  Manage Admins
                                </h4>
                                <p className="text-xs text-gray-500">
                                  Admin controls
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </CheckPermission>
                      
                      <CheckPermission permission="manager-list" fallback={null}>
                        <Link href="/managers">
                          <div className="group p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 p-2 bg-emerald-600 rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-200">
                                <UsersIcon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                                  Manage Managers
                                </h4>
                                <p className="text-xs text-gray-500">
                                  Manager roles
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </CheckPermission>
                      
                      <Link href="/settings">
                        <div className="group p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 p-2 bg-orange-600 rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-200">
                              <CogIcon className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 group-hover:text-orange-700 transition-colors">
                                System Settings
                              </h4>
                              <p className="text-xs text-gray-500">
                                System config
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                      
                      <CheckPermission permission="report-list" fallback={null}>
                        <Link href="/reports">
                          <div className="group p-3 bg-gradient-to-r from-teal-50 to-teal-100 rounded-lg border border-teal-200 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 p-2 bg-teal-600 rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-200">
                                <ChartBarIcon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
                                  System Reports
                                </h4>
                                <p className="text-xs text-gray-500">
                                  System analytics
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </CheckPermission>
                    </>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 