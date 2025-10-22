import { app } from '@azure/functions';
import { answerMedicalQuestion } from '../lib/medical-qa.js';

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
            // Parse request parameters
            let question = '';
            let maxSources = 5;
            let temperature = 0.2;
            
            if (request.method === 'GET') {
                question = request.query.get('question') || '';
                maxSources = parseInt(request.query.get('maxSources') || '5');
                temperature = parseFloat(request.query.get('temperature') || '0.2');
            } else {
                const body = await request.json();
                question = body.question || '';
                maxSources = body.maxSources || 5;
                temperature = body.temperature || 0.2;
            }

            if (!question || question.trim().length === 0) {
                return {
                    status: 400,
                    jsonBody: {
                        ok: false,
                        error: 'Missing required parameter: question'
                    }
                };
            }

            context.log(`Processing question: "${question.slice(0, 100)}..."`);

            // Call the RAG-powered medical Q&A function
            const result = await answerMedicalQuestion(question, {
                maxSources,
                temperature
            });

            context.log(`Answer generated with ${result.confidence * 100}% confidence`);

            return {
                status: 200,
                jsonBody: {
                    ok: true,
                    ...result
                }
            };

        } catch (error) {
            context.error('Error in medical-qa function:', error);
            
            return {
                status: 500,
                jsonBody: {
                    ok: false,
                    error: 'Internal server error',
                    message: error.message
                }
            };
        }
    }
});
