import { app } from '@azure/functions';

/**
 * Azure Function: Medical Q&A HTTP Trigger
 * Answers medical questions using RAG from indexed cardiology guidelines
 */
app.http('medical-qa', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Medical Q&A function triggered');

        try {
            // Parse request body
            let question = '';
            
            if (request.method === 'GET') {
                question = request.query.get('question') || '';
            } else {
                const body = await request.json();
                question = body.question || '';
            }

            if (!question || question.trim().length === 0) {
                return {
                    status: 400,
                    jsonBody: {
                        error: 'Missing required parameter: question'
                    }
                };
            }

            // TODO: Integrate with your medical-qa.js module
            // For now, return a placeholder response
            const response = {
                question: question,
                answer: 'Medical Q&A integration pending. This function will connect to your RAG system.',
                sources: [],
                confidence: 0,
                note: 'Deploy your services/ai-search backend or integrate the medical-qa.js module here'
            };

            return {
                status: 200,
                jsonBody: response
            };

        } catch (error) {
            context.error('Error in medical-qa function:', error);
            
            return {
                status: 500,
                jsonBody: {
                    error: 'Internal server error',
                    message: error.message
                }
            };
        }
    }
});
