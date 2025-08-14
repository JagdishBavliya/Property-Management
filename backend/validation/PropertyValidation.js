const { body } = require('express-validator');

const isValidVideoUrl = (url) => {
    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();

        if (hostname.includes('youtube.com')) {
            return parsed.searchParams.has('v') && parsed.searchParams.get('v').length === 11;
        }

        if (hostname.includes('youtu.be')) {
            return parsed.pathname.length === 12;
        }

        if (hostname.includes('vimeo.com')) {
            return /^\d+$/.test(parsed.pathname.replace('/', ''));
        }

        return false;
    } catch (err) {
        return false;
    }
};
  

const propertyValidationRules = [
    body('property_name').notEmpty().withMessage('Property name is required').bail(),
    body('area').notEmpty().withMessage('Area is required').bail(),
    body('city').notEmpty().withMessage('City is required').bail(),
    body('property_type').notEmpty().withMessage('Property type is required').bail(),
    body('number_of_units').notEmpty().withMessage('Number of units is required').bail(),
    body('property_size').notEmpty().withMessage('Property size is required').bail(),
    body('property_rate').notEmpty().withMessage('Property rate is required').bail(),
    body('seller_name').notEmpty().withMessage('Seller name is required').bail(),
    body('seller_mobile').notEmpty().withMessage('Seller mobile is required').bail(),
    // body('buyer_name').notEmpty().withMessage('Buyer name is required').bail(),
    // body('buyer_mobile').notEmpty().withMessage('Buyer mobile is required').bail(),
    body('seller_brokerage_type').notEmpty().withMessage('Seller brokerage type is required').bail(),
    body('seller_brokerage_value').notEmpty().withMessage('Seller brokerage value is required').bail(),
    // body('buyer_brokerage_type').notEmpty().withMessage('Buyer brokerage type is required').bail(),
    // body('buyer_brokerage_value').notEmpty().withMessage('Buyer brokerage value is required').bail(),
    body('agent_code').notEmpty().withMessage('Agent is required').bail(),
    body('full_deal_amount').notEmpty().withMessage('Full deal amount is required').bail(),
    body('video_link')
    .optional({ checkFalsy: true }) // Remove this line if you want to make it required
    .custom((value) => {
      if (!isValidVideoUrl(value)) {
        throw new Error('Invalid video URL. Only YouTube and Vimeo links are supported.');
      }
      return true;
    }),
];
module.exports = {
    propertyValidationRules
};
