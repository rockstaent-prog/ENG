import { defineConfig, loadEnv } from 'vite';
import { chatMiddleware } from './server/chat.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const middleware = chatMiddleware(env.ENGLISH_AI_KEY || process.env.ENGLISH_AI_KEY);
  return {
    base: mode === 'static' ? './' : '/',
    define: { 'import.meta.env.VITE_STATIC_PREVIEW': JSON.stringify(mode === 'static' ? 'true' : 'false') },
    plugins: [{ name: 'english-conversation', configureServer(server) { server.middlewares.use(middleware); }, configurePreviewServer(server) { server.middlewares.use(middleware); } }],
  };
});
