export const FEATURE_FLAGS = {
  USE_SUPABASE_STORAGE: process.env.USE_SUPABASE_STORAGE === 'true',
  USE_EXTERNAL_SOURCES: process.env.USE_EXTERNAL_SOURCES === 'true',
  USE_VISION: process.env.USE_VISION !== 'false'
};
