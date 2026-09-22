import orig from './index.js';
import { handleProjectVideos, isProjectVideosRequest } from './project-videos-api.js';

export default {
  async scheduled(controller, env, ctx) {
    return orig.scheduled?.(controller, env, ctx);
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (isProjectVideosRequest(url)) {
      return handleProjectVideos(request, env, url);
    }
    return orig.fetch(request, env, ctx);
  },
};
