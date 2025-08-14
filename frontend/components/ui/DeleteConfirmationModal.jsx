import { ExclamationTriangleIcon, UserIcon, BuildingOfficeIcon, HomeIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Modal from './Modal';
import Button from './Button';
import CodeBadge from './CodeBadge';  

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  title = "Delete Item",
  description = "This action will permanently remove the item from the system.",
  itemType = "item", // "manager", "agent", "property", etc.
  itemData = null, // The item data to display
  confirmText = "Delete",
  cancelText = "Cancel"
}) => {
  // Get icon based on item type
  const getItemIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'manager':
      case 'agent':
      case 'user':
        return UserIcon;
      case 'property':
        return BuildingOfficeIcon;
      case 'brokerage':
        return HomeIcon;
      default:
        return UserGroupIcon;
    }
  };

  // Get badge variant based on item type
  const getBadgeVariant = (type) => {
    switch (type?.toLowerCase()) {
      case 'manager':
        return 'warning';
      case 'agent':
        return 'success';
      case 'property':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  // Get item display name
  const getItemDisplayName = (data, type) => {
    if (!data) return '';
    
    switch (type?.toLowerCase()) {
      case 'manager':
      case 'agent':
      case 'user':
        return data.name || data.user_name || 'Unknown User';
      case 'property':
        return data.property_name || data.name || 'Unknown Property';
      case 'brokerage':
        return data.brokerage_name || data.name || 'Unknown Brokerage';
      default:
        return data.name || 'Unknown Item';
    }
  };

  // Get item code
  const getItemCode = (data, type) => {
    if (!data) return '';
    
    switch (type?.toLowerCase()) {
      case 'admin':
      case 'manager':
      case 'agent':
      case 'user':
        return data.user_code || data.code || '';
      case 'property':
        return data.property_code || data.code || '';
      case 'brokerage':
        return data.brokerage_code || data.code || '';
      default:
        return data.code || '';
    }
  };

  // Get item details
  const getItemDetails = (data, type) => {
    if (!data) return [];
    
    const details = [];
    
    switch (type?.toLowerCase()) {
      case 'admin':
      case 'manager':
      case 'agent':
      case 'user':
        if (data.email) details.push({ label: 'Email', value: data.email });
        if (data.phone) details.push({ label: 'Phone', value: data.phone });
        if (data.role) details.push({ label: 'Role', value: data.role });
        break;
      case 'property':
        if (data.city) details.push({ label: 'City', value: data.city });
        if (data.property_type) details.push({ label: 'Type', value: data.property_type });
        if (data.full_deal_amount) details.push({ label: 'Price', value: `₹${Number(data.full_deal_amount).toLocaleString()}` });
        break;
      case 'brokerage':
        if (data.address) details.push({ label: 'Address', value: data.address });
        if (data.phone) details.push({ label: 'Phone', value: data.phone });
        break;
    }
    
    return details;
  };

  const ItemIcon = getItemIcon(itemType);
  const badgeVariant = getBadgeVariant(itemType);
  const itemName = getItemDisplayName(itemData, itemType);
  const itemCode = getItemCode(itemData, itemType);
  const itemDetails = getItemDetails(itemData, itemType);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="md"
    >
      <div className="relative">
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl opacity-10"></div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 relative z-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-600 max-w-sm mx-auto">
            {description}
          </p>
        </div>

        {/* Warning Section */}
        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center">
              <ExclamationTriangleIcon className="w-3 h-3 text-red-600" />
            </div>
            <h4 className="text-base font-semibold text-gray-900">Warning</h4>
          </div>
          <div className="bg-white rounded-lg border border-red-200 p-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <ExclamationTriangleIcon className="w-3 h-3 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  This action cannot be undone
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Once deleted, the {itemType} and all associated data will be permanently removed from the system. This includes their profile, permissions, and any linked activities.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Item Details Section */}
        {itemData && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                <ItemIcon className="w-3 h-3 text-blue-600" />
              </div>
              <h4 className="text-base font-semibold text-gray-900">
                {itemType.charAt(0).toUpperCase() + itemType.slice(1)} Details
              </h4>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <ItemIcon className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {itemName}
                  </p>
                  {itemCode && (
                    <div className="flex items-center gap-2 mt-1">
                      <CodeBadge code={itemCode} size="xxs" />
                    </div>
                  )}
                  {itemDetails.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {itemDetails.map((detail, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="font-medium">{detail.label}:</span>
                          <span>{detail.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2"
          >
            {cancelText}
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
            className="px-6 py-2"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal; 