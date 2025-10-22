import { app } from '@azure/functions';

/**
 * Azure Function: Health Check HTTP Trigger
 * Returns API status and configuration
 */
app.http('health', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Health check triggered');

        const response = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'Cardiology Suite API',
            version: '1.0.0',
            endpoints: {
                health: '/api/health',
                medicalQA: '/api/medical-qa'
            }
        };

        return {
            status: 200,
            jsonBody: response
        };
    }
});
