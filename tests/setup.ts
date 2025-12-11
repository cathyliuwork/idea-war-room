// Vitest setup file
import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.AUTH_MODE = 'mock';
process.env.AI_BUILDERS_API_KEY = 'test-api-key';
process.env.AI_BUILDERS_API_URL = 'https://test.ai-builders.com';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
