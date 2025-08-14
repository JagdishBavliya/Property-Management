import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { 
  createProperty, 
  selectCreatePropertyLoading, 
  selectCreatePropertyError,
  clearCreateError 
} from '../../store/slices/propertiesSlice';

// Components
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Breadcrumb from '../../components/ui/Breadcrumb';
import CheckPermission from '../../components/ui/CkeckPermission';
import { BROKERAGE_TYPES, numericInputProps } from '../../utils/constants';

import {
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserIcon,
  PhoneIcon,
  DocumentIcon,
  VideoCameraIcon,
  HomeIcon,
  BuildingStorefrontIcon,
  CameraIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosInstance';

const PROPERTY_TYPES = [
  { value: 'Residential', label: 'Residential', icon: HomeIcon },
  { value: 'Commercial', label: 'Commercial', icon: BuildingStorefrontIcon },
  { value: 'Industrial', label: 'Industrial', icon: BuildingOfficeIcon },
];

export default function CreateProperty() {
  const dispatch = useDispatch();
  const router = useRouter();
  const loading = useSelector(selectCreatePropertyLoading);
  const error = useSelector(selectCreatePropertyError);

  
  const [allAgents, setAllAgents] = useState([]);
  const [allAgentsLoading, setAllAgentsLoading] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    setError,
    clearErrors,
    reset,
  } = useForm({
    defaultValues: {
      property_name: '',
      area: '',
      city: '',
      property_type: 'Residential',
      number_of_units: '',
      property_size: '',
      property_rate: '',
      seller_name: '',
      seller_mobile: '',
      buyer_name: '',
      buyer_mobile: '',
      seller_brokerage_type: 'Percentage',
      seller_brokerage_value: '',
      buyer_brokerage_type: 'Flat',
      buyer_brokerage_value: '',
      full_deal_amount: '',
      video_link: '',
      agent_code: 'AGT-XXXXXX',
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearCreateError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    setAllAgentsLoading(true);
    axiosInstance.get('/api/users/agents-for-current-user')
      .then(res => {
        setAllAgents(res.data.agents || []);
      })
      .catch((error) => {
        console.error('Failed to fetch agents:', error);
        toast.error('Failed to load agents');
      })
      .finally(() => {
        setAllAgentsLoading(false);
      });
  }, []);

  // Show immediate validation if there are no agents available
  useEffect(() => {
    if (!allAgentsLoading) {
      const eligibleAgents = allAgents.filter(agent => {
        return agent.role === 'Agent' || 
               agent.role === 'agent' || 
               agent.agent_type || 
               agent.user_code?.startsWith('AGT-');
      });
      if (eligibleAgents.length === 0) {
        setValue('agent_code', '');
        setError('agent_code', { type: 'manual', message: 'No agents available. Please add an agent first.' });
      } else {
        clearErrors('agent_code');
      }
    }
  }, [allAgents, allAgentsLoading, setError, clearErrors, setValue]);

  // Set default agent to first valid option once agents are loaded, if user hasn't changed it
  useEffect(() => {
    if (!allAgentsLoading && allAgents.length > 0) {
      const eligibleAgents = allAgents.filter(agent => {
        return agent.role === 'Agent' || 
               agent.role === 'agent' || 
               agent.agent_type || 
               agent.user_code?.startsWith('AGT-');
      });
      if (eligibleAgents.length > 0) {
        const firstAgentCode = eligibleAgents[0].user_code;
        if (!watchedValues.agent_code || watchedValues.agent_code === 'AGT-XXXXXX') {
          setValue('agent_code', firstAgentCode);
        }
      }
    }
  }, [allAgents, allAgentsLoading, setValue, watchedValues.agent_code]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setValue('property_brochure', file);      
      if (file.type === 'application/pdf') {
        setFilePreview({
          name: file.name,
          type: 'pdf',
          size: file.size
        });
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setValue('property_image', file);      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview({
            src: e.target.result,
            name: file.name,
            size: file.size
          });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      const formData = {
        ...data,
        property_brochure: selectedFile,
        property_image: selectedImage,
      };

      await dispatch(createProperty(formData)).unwrap();
      toast.success('Property created successfully!');
      router.push('/properties');
    } catch (error) {}
  };

  const calculateTotalAmount = () => {
    const dealAmount = parseFloat(watchedValues.full_deal_amount) || 0;
    const sellerBrokerage = parseFloat(watchedValues.seller_brokerage_value) || 0;
    const buyerBrokerage = parseFloat(watchedValues.buyer_brokerage_value) || 0;
    
    let sellerAmount = 0;
    let buyerAmount = 0;
    
    if (watchedValues.seller_brokerage_type === 'Percentage') {
      sellerAmount = (dealAmount * sellerBrokerage) / 100;
    } else {
      sellerAmount = sellerBrokerage;
    }
    
    if (watchedValues.buyer_brokerage_type === 'Percentage') {
      buyerAmount = (dealAmount * buyerBrokerage) / 100;
    } else {
      buyerAmount = buyerBrokerage;
    }
    
    return {
      sellerAmount: sellerAmount.toFixed(2),
      buyerAmount: buyerAmount.toFixed(2),
      totalBrokerage: (sellerAmount + buyerAmount).toFixed(2)
    };
  };

  const brokerageCalculation = calculateTotalAmount();

  const UnauthorizedMessage = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card variant="elevated">
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
            <BuildingOfficeIcon className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Sorry, you are not authorized to create this property</h3>
          <p className="text-gray-600 mb-6">Please contact the property owner to create this property</p>
          <Button variant="primary" onClick={() => router.push('/properties')}>
            Back to Properties
          </Button>
        </div>
      </Card>
    </div>
  );

  return (
    <CheckPermission permission="property-create" fallback={<UnauthorizedMessage />}>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Breadcrumb
              items={[
                { label: 'Properties', href: '/properties' },
                { label: 'Create Property', icon: BuildingOfficeIcon }
              ]}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
              <BuildingOfficeIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Property</h1>
              <p className="mt-1 text-sm text-gray-600">
                Add a new property listing to your portfolio
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Property Information */}
            <Card variant="elevated">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <BuildingOfficeIcon className="h-4 w-4 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Property Name"
                      placeholder="Enter property name"
                      {...register('property_name', { 
                        required: 'Property name is required' 
                      })}
                      error={errors.property_name?.message}
                      leftIcon={BuildingOfficeIcon}
                      required={true}
                      className="py-2.5"
                    />
                  </div>
                  
                  <div>
                    <Input
                      label="City"
                      placeholder="Enter city"
                      {...register('city', { 
                        required: 'City is required' 
                      })}
                      error={errors.city?.message}
                      leftIcon={MapPinIcon}
                      required={true}
                      className="py-2.5"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Type
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {PROPERTY_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setValue('property_type', type.value)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            watchedValues.property_type === type.value
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <type.icon className="h-5 w-5 mx-auto mb-1" />
                          <span className="text-xs font-medium">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Input
                      label="Area"
                      placeholder="Enter area"
                      {...register('area', { 
                        required: 'Area is required' 
                      })}
                      error={errors.area?.message}
                      required={true}
                      className="py-2.5"
                    />
                  </div>
                  
                  <div>
                    <Input
                      label="Property Size (sq ft)"
                      placeholder="Enter property size"
                      {...register('property_size', { 
                        required: 'Property size is required' 
                      })}
                      {...numericInputProps.decimal({ decimalPlaces: 2 })}
                      error={errors.property_size?.message}
                      required={true}
                      className="py-2.5"
                    />
                  </div>
                  
                  <div>
                    <Input
                      label="Number of Units"
                      placeholder="Enter number of units"
                      {...register('number_of_units', { 
                        required: 'Number of units is required' 
                      })}
                      {...numericInputProps.digits()}
                      error={errors.number_of_units?.message}
                      required={true}
                      className="py-2.5"
                    />
                  </div>
                  
                  <div>
                    <Input
                      label="Property Rate (₹/sq ft)"
                      placeholder="Enter property rate"
                      {...register('property_rate', { 
                        required: 'Property rate is required' 
                      })}
                      {...numericInputProps.decimal({ decimalPlaces: 2 })}
                      error={errors.property_rate?.message}
                      leftIcon={CurrencyDollarIcon}
                      required={true}
                      className="py-2.5"
                    />
                  </div>
                  
                  <div>
                    <Input
                      label="Full Deal Amount (₹)"
                      placeholder="Enter full deal amount"
                      {...register('full_deal_amount', { 
                        required: 'Full deal amount is required' 
                      })}
                      {...numericInputProps.decimal({ decimalPlaces: 2 })}
                      error={errors.full_deal_amount?.message}
                      leftIcon={CurrencyDollarIcon}
                      required={true}
                      className="py-2.5"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Seller Information */}
            <Card variant="elevated">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-success-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Seller Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Seller Name"
                      placeholder="Enter seller name"
                      {...register('seller_name', { 
                        required: 'Seller name is required' 
                      })}
                      error={errors.seller_name?.message}
                      leftIcon={UserIcon}
                      required={true}
                      className="py-2.5"
                    />
                  </div>
                  
                  <div>
                    <Input
                      label="Seller Mobile"
                      placeholder="Enter seller mobile"
                      {...register('seller_mobile', { 
                        required: 'Seller mobile is required',
                        pattern: { value: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit mobile number' }
                      })}
                      {...numericInputProps.digits({ maxLength: 10 })}
                      error={errors.seller_mobile?.message}
                      leftIcon={PhoneIcon}
                      required={true}
                      className="py-2.5"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seller Brokerage Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {BROKERAGE_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setValue('seller_brokerage_type', type.value)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            watchedValues.seller_brokerage_type === type.value
                              ? 'border-success-500 bg-success-50 text-success-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <span className="text-sm font-medium">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Input
                      label={`Seller Brokerage Value ${watchedValues.seller_brokerage_type === 'Percentage' ? '(%)' : '(₹)'}`}
                      placeholder={`Enter seller brokerage ${watchedValues.seller_brokerage_type === 'Percentage' ? 'percentage' : 'amount'}`}
                      {...register('seller_brokerage_value', { 
                        required: 'Seller brokerage value is required' 
                      })}
                      {...numericInputProps.decimal({ decimalPlaces: 2 })}
                      error={errors.seller_brokerage_value?.message}
                      leftIcon={CurrencyDollarIcon}
                      required={true}
                      className="py-2.5"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Buyer Information */}
            <Card variant="elevated">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-warning-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Buyer Information</h2>
                  <span className="text-sm text-gray-500">(Optional - Leave blank if property is available)</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Buyer Name"
                      placeholder="Enter buyer name"
                      {...register('buyer_name')}
                      leftIcon={UserIcon}
                      className="py-2.5"
                    />
                  </div>
                  
                  <div>
                    <Input
                      label="Buyer Mobile"
                      placeholder="Enter buyer mobile"
                      {...register('buyer_mobile', {
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: 'Please enter a valid 10-digit mobile number'
                        }
                      })}
                      {...numericInputProps.digits({ maxLength: 10 })}
                      error={errors.buyer_mobile?.message}
                      leftIcon={PhoneIcon}
                      className="py-2.5"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buyer Brokerage Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {BROKERAGE_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setValue('buyer_brokerage_type', type.value)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            watchedValues.buyer_brokerage_type === type.value
                              ? 'border-warning-500 bg-warning-50 text-warning-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <span className="text-sm font-medium">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Input
                      label={`Buyer Brokerage Value ${watchedValues.buyer_brokerage_type === 'Percentage' ? '(%)' : '(₹)'}`}
                      placeholder={`Enter buyer brokerage ${watchedValues.buyer_brokerage_type === 'Percentage' ? 'percentage' : 'amount'}`}
                      {...register('buyer_brokerage_value')}
                      {...numericInputProps.decimal({ decimalPlaces: 2 })}
                      leftIcon={CurrencyDollarIcon}
                      className="py-2.5"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Brokerage Calculation */}
            {(watchedValues.seller_brokerage_value || watchedValues.buyer_brokerage_value) && (
              <Card variant="elevated">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-info-100 rounded-lg flex items-center justify-center">
                      <CurrencyDollarIcon className="h-4 w-4 text-info-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Brokerage Calculation</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-success-50 p-4 rounded-lg">
                      <div className="text-sm text-success-600 font-medium">Seller Brokerage</div>
                      <div className="text-2xl font-bold text-success-700">₹{brokerageCalculation.sellerAmount}</div>
                    </div>
                    <div className="bg-warning-50 p-4 rounded-lg">
                      <div className="text-sm text-warning-600 font-medium">Buyer Brokerage</div>
                      <div className="text-2xl font-bold text-warning-700">₹{brokerageCalculation.buyerAmount}</div>
                    </div>
                    <div className="bg-primary-50 p-4 rounded-lg">
                      <div className="text-sm text-primary-600 font-medium">Total Brokerage</div>
                      <div className="text-2xl font-bold text-primary-700">₹{brokerageCalculation.totalBrokerage}</div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Additional Information */}
            <Card variant="elevated">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <DocumentIcon className="h-4 w-4 text-secondary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Additional Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent
                    </label>
                    <select
                      {...register('agent_code', { 
                        required: 'Agent is required' 
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/30 focus:border-primary-500 text-sm sm:text-base transition-all duration-300 bg-white hover:border-gray-300 shadow-soft focus:shadow-medium"
                      disabled={allAgentsLoading || allAgents.length === 0}
                    >
                      {allAgentsLoading ? (
                        <option>Loading agents...</option>
                      ) : allAgents.length === 0 ? (
                        <option>No agents available</option>
                      ) : (
                        allAgents
                          .filter(agent => {
                            // Check multiple possible role formats
                            return agent.role === 'Agent' || 
                                   agent.role === 'agent' || 
                                   agent.agent_type || 
                                   agent.user_code?.startsWith('AGT-');
                          })
                          .map((agent) => (
                            <option key={agent.user_code} value={agent.user_code}>
                              {agent.user_code} - {agent.name}
                            </option>
                          ))
                      )}
                    </select>
                    {errors.agent_code && (
                      <p className="mt-1 text-sm text-red-600">{errors.agent_code.message}</p>
                    )}
                  </div>
                    
                  <div>
                    <Input
                      label="Video Link"
                      placeholder="Enter video link (optional)"
                      {...register('video_link')}
                      leftIcon={VideoCameraIcon}
                      className="py-2.5"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Image
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                      <div className="space-y-1 text-center">
                        <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="image-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                          >
                            <span>Upload an image</span>
                            <input
                              id="image-upload"
                              name="image-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImageChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB</p>
                      </div>
                    </div>
                    {imagePreview && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <img 
                            src={imagePreview.src} 
                            alt="Preview" 
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-700">{imagePreview.name}</div>
                            <div className="text-xs text-gray-500">
                              ({(imagePreview.size / 1024 / 1024).toFixed(2)} MB)
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Brochure
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                      <div className="space-y-1 text-center">
                        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              accept=".pdf,.doc,.docx"
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                      </div>
                    </div>
                    {filePreview && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <DocumentIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">{filePreview.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(filePreview.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/properties')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
                icon={PlusIcon}
                className="px-6 py-2"
              >
                Create Property
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </CheckPermission>
  );
} 