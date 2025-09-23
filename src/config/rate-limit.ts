
const rateLimit = require('express-rate-limit');


const limiter = rateLimit({
    windowMs: 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 100 requests per `windowMs`
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export default limiter;