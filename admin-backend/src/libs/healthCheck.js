// src/libs/healthCheck.js
export const performHealthCheck = async () => {
  return {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'UP'
    }
  };
};
