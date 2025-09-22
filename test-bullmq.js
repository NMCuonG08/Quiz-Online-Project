const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');

async function testBullMQ() {
    try {
        console.log('Starting application...');
        const app = await NestFactory.create(AppModule);

        console.log('Application started successfully!');
        console.log('BullMQ queues should now be registered.');

        // Get the JobRepository to test queue access
        const jobRepository = app.get('JobRepository');
        console.log('JobRepository obtained successfully');

        // Try to get a specific queue to test if it's registered
        const moduleRef = app.get('ModuleRef');
        const { getQueueToken } = require('@nestjs/bullmq');

        try {
            const thumbnailQueue = moduleRef.get(getQueueToken('thumbnailGeneration'), { strict: false });
            console.log('✅ ThumbnailGeneration queue found:', !!thumbnailQueue);
        } catch (error) {
            console.log('❌ ThumbnailGeneration queue not found:', error.message);
        }

        await app.close();
        console.log('Test completed successfully!');
    } catch (error) {
        console.error('❌ Error during test:', error.message);
        process.exit(1);
    }
}

testBullMQ();