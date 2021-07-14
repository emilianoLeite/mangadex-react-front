import { ChapterApi, Configuration } from "mangadex-api-client";

export const chapterApi = (accessToken: string) =>
  new ChapterApi(new Configuration({ accessToken }));
