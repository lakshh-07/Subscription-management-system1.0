// Global error handling middleware
// Sends JSON error responses with proper status codes
module.exports = (err, req, res, next) => {
  console.error('Error:', err);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ success: false, message });
};
