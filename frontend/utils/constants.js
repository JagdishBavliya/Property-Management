export const LOGO_IMAGE = '/logo.webp';

export const AGENT_TYPES = [
  { value: 'Residential', label: 'Residential' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Both', label: 'Both' },
];

export const PROPERTY_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'Residential', label: 'Residential' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Industrial', label: 'Industrial' },
];

export const BROKERAGE_TYPES = [
  { value: 'Percentage', label: 'Percentage (%)' },
  { value: 'Flat', label: 'Flat Amount (₹)' },
];

export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
];

export const ESTIMATE_STATUSES = [
  { value: 'Draft', label: 'Draft', variant: 'secondary' },
  { value: 'Sent', label: 'Sent', variant: 'primary' },
  { value: 'Approved', label: 'Approved', variant: 'success' },
  { value: 'Rejected', label: 'Rejected', variant: 'danger' },
  { value: 'Expired', label: 'Expired', variant: 'warning' },
];

export const DEFAULT_FORM_VALUES = {
  propertyCode: "",
  agentCode: "",
  propertySize: "",
  propertyRate: "",
  brokerageSeller: "",
  brokerageBuyer: "",
  additionalCosts: "",
  status: "Draft",
};

export const REPORT_TYPES = [
  { value: "property", label: "Property Report" },
  { value: "agent", label: "Agent Report" },
  { value: "visit", label: "Visit Report" },
  { value: "manager", label: "Manager Report" },
  { value: "brokerage", label: "Brokerage Report" },
];

export const visitStatuses = [
  { value: "Pending", label: "Pending", variant: "warning" },
  { value: "Interested", label: "Interested", variant: "success" },
  { value: "Not Interested", label: "Not Interested", variant: "danger" },
  { value: "Follow-Up", label: "Follow-Up", variant: "primary" },
  { value: "Converted", label: "Converted", variant: "accent" },
];

export const TARGET_AUDIENCES = [
  { value: "all", label: "All Users" },
  { value: "agents", label: "All Agents" },
  { value: "managers", label: "All Managers" },
  { value: "admins", label: "All Admins" },
  { value: "specific", label: "Specific Users" },
];

export const PRIORITY_LEVELS = [
  { value: "low", label: "Low", variant: "secondary" },
  { value: "medium", label: "Medium", variant: "primary" },
  { value: "high", label: "High", variant: "warning" },
  { value: "urgent", label: "Urgent", variant: "danger" },
];

export const STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "bg-gray-100 text-gray-800" },
  { value: "expired", label: "Expired", color: "bg-blue-100 text-blue-800" },
  { value: "scheduled", label: "Scheduled", color: "bg-yellow-100 text-yellow-800" },
];

export const exportFormats = [
  { value: 'csv', label: 'CSV', icon: null, description: 'Spreadsheet format' },
  { value: 'pdf', label: 'PDF', icon: null, description: 'Document format' },
];

export const FORMATDATE = (date, format = 1) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const monthShortName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
  
  const formats = {
    1: `${day}-${month}-${year}`,
    2: `${day} ${monthShortName}, ${year}`,
    3: `${day} ${monthShortName}, ${year} ${d.getHours() > 12 ? d.getHours() - 12 : d.getHours()}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`
  };
  return formats[format] || formats[1];
};

export const FORMATCURRENCY = (amount, currency = 'INR', locale = 'en-IN') => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Numeric input handler
// Usage example in inputs: {...numericInputProps.digits({ maxLength: 10 })}
export const createDigitsOnlyHandler = (options = {}) => {
  const { maxLength } = options;
  return (e) => {
    let value = e?.target?.value ?? '';
    value = String(value).replace(/\D+/g, '');
    if (typeof maxLength === 'number') {
      value = value.slice(0, maxLength);
    }
    e.target.value = value;
  };
};

// Decimal input handler
export const createDecimalHandler = (options = {}) => {
  const { decimalPlaces = null, allowNegative = false } = options;
  return (e) => {
    let value = e?.target?.value ?? '';
    value = String(value);
    const hasLeadingMinus = allowNegative && value.startsWith('-');
    value = value.replace(/[^0-9.]/g, '');

    const firstDot = value.indexOf('.');
    if (firstDot !== -1) {
      const integerPart = value.slice(0, firstDot);
      let fractionPart = value.slice(firstDot + 1).replace(/\./g, '');
      if (decimalPlaces !== null && typeof decimalPlaces === 'number') {
        fractionPart = fractionPart.slice(0, decimalPlaces);
      }
      value = `${integerPart}.${fractionPart}`;
    }

    if (value === '.') value = '0.';
    if (value === '-.') value = '-0.';
    if (hasLeadingMinus && !value.startsWith('-')) value = `-${value}`;
    e.target.value = value;
  };
};

// Numeric input props
export const numericInputProps = {
  digits: (options = {}) => ({
    inputMode: 'numeric',
    pattern: '[0-9]*',
    onInput: createDigitsOnlyHandler(options),
  }),
  decimal: (options = {}) => ({
    inputMode: 'decimal',
    onInput: createDecimalHandler(options),
  }),
};