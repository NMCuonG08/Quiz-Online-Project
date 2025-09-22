const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');

async function testJob() {
    try {
        console.log('🚀 Starting application...');
        const app = await NestFactory.create(AppModule);

        console.log('✅ Application started successfully!');

        // Get the JobRepository and QuizService
        const jobRepository = app.get('JobRepository');
        const quizService = app.get('QuizService');

        console.log('📋 Setting up job handlers...');
        jobRepository.setupWithInstances([quizService]);

        console.log('👷 Starting workers...');
        jobRepository.startWorkers();

        console.log('📤 Testing job queue...');

        // Test job queue
        await jobRepository.queue({
            name: 'UploadImage',
            data: {
                id: 'test-id-123',
                image: {
                    originalname: 'test.jpg',
                    mimetype: 'image/jpeg',
                    buffer: Buffer.from('fake-image-data')
                }
            }
        });

        console.log('✅ Job queued successfully!');
        console.log('⏳ Waiting 3 seconds for job processing...');

        // Wait a bit for job to process
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('🏁 Test completed!');

        await app.close();
    } catch (error) {
        console.error('❌ Error during test:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testJob();