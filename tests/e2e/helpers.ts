import type { Page } from "@playwright/test";

import catalog from "./fixtures/catalog.json" with { type: "json" };

export async function mockExternalServices(page: Page) {
  await page.route("**/api/catalog**", async (route) => {
    const url = new URL(route.request().url());
    const mode = url.searchParams.get("mode");
    const era = url.searchParams.get("era") as keyof typeof catalog | null;
    const items = mode === "recommendations" && era ? catalog[era] : catalog.search;
    await route.fulfill({ json: { items } });
  });
  await page.route("https://www.youtube.com/iframe_api", async (route) => {
    await route.fulfill({
      contentType: "application/javascript",
      body: `window.YT={Player:function(id,options){this.loadVideoById=function(){};this.playVideo=function(){options.events.onStateChange({data:1,target:this})};this.pauseVideo=function(){options.events.onStateChange({data:2,target:this})};this.seekTo=function(){};this.setVolume=function(){};this.getCurrentTime=function(){return 0};this.getDuration=function(){return 210};this.destroy=function(){};var host=document.getElementById(id);if(host){var frame=document.createElement('iframe');frame.title='YouTube video player';host.appendChild(frame)};setTimeout(()=>options.events.onReady({target:this}),0)}};window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady();`,
    });
  });
}
