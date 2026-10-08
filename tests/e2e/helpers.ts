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
      body: `window.__daydreaminPlayers=[];window.YT={Player:function(id,options){var self=this;this.currentTime=0;this.duration=210;this.loadVideoById=function(videoId){self.videoId=videoId;options.events.onStateChange({data:3,target:self});setTimeout(function(){options.events.onStateChange({data:1,target:self})},0)};this.playVideo=function(){options.events.onStateChange({data:1,target:self})};this.pauseVideo=function(){options.events.onStateChange({data:2,target:self})};this.seekTo=function(value){self.currentTime=value};this.setVolume=function(){};this.getCurrentTime=function(){return self.currentTime};this.getDuration=function(){return self.duration};this.destroy=function(){};this.__end=function(){options.events.onStateChange({data:0,target:self})};window.__daydreaminPlayers.push(this);var host=document.getElementById(id);if(host){var frame=document.createElement('iframe');frame.title='YouTube video player';host.appendChild(frame)};setTimeout(function(){options.events.onReady({target:self})},0)}};window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady();`,
    });
  });
}
