import { ChapterApi, Configuration } from "mangadex-client";

export const chapterApi = (accessToken: string) =>
  new ChapterApi(new Configuration({ accessToken }));
