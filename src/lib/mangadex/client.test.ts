import "@testing-library/jest-dom/extend-expect";
import type {
  ChapterList,
  ChapterResponse,
  LoginResponse,
  RefreshResponse,
} from "mangadex-client";

import axios, { AxiosResponse } from "axios";
import { followedMangaList, getFreshSessionToken, login } from "./client";
import { chapterApi } from "./ChapterApi";
import chapterFixture from "./__fixtures__/chapter";

// TODO only mock mangadex-client
const mockedAxios = axios as jest.Mocked<typeof axios>;
jest.mock("./ChapterApi");
const mockedChapterApi = chapterApi("mock-token") as jest.Mocked<
  ReturnType<typeof chapterApi>
>;

describe("#getFreshSessionToken", () => {
  describe("when tokens were not previously persisted", () => {
    it("throws an error", async () => {
      expect.assertions(1);

      await expect(getFreshSessionToken()).rejects.toThrow(
        "stored tokens not found"
      );
    });
  });

  describe("when tokens were previously persisted", () => {
    const currentSessionToken = "currentSessionToken";
    const currentRefreshToken = "currentRefreshToken";

    beforeEach(() => {
      window.localStorage.setItem("session-token", currentSessionToken);
      window.localStorage.setItem("refresh-token", currentRefreshToken);
    });

    describe("when current sessionToken is still valid", () => {
      const oneHourFromNow = new Date().getTime() + 1000 * 60 * 60;

      beforeEach(() => {
        window.localStorage.setItem("session-token-ttl", `${oneHourFromNow}`);
      });

      it("returns current sessionToken", async () => {
        expect.assertions(1);

        const result = await getFreshSessionToken();

        expect(result).toEqual(currentSessionToken);
      });
    });

    describe("when current sessionToken is expired, tries to refresh it", () => {
      const oneHourAgo = new Date().getTime() - 1000 * 60 * 60;

      beforeEach(() => {
        window.localStorage.setItem("session-token-ttl", `${oneHourAgo}`);
      });

      describe("when refresh request is sucessful", () => {
        const fifteenMinutesFromNow = new Date().getTime() + 1000 * 60 * 15;

        it("returns the new sessionToken and stores it", async () => {
          expect.assertions(3);
          // expect.assertions(4);
          const refreshTokenResponse = {
            token: {
              session: "new-session",
              refresh: "new-refresh",
            },
          } as RefreshResponse;
          const axiosResponse = {
            data: refreshTokenResponse,
          };
          mockedAxios.post.mockResolvedValue(axiosResponse);

          const freshToken = await getFreshSessionToken();

          expect(freshToken).toEqual("new-session");
          // TODO: freeze time so we can assert TTL
          // expect(window.localStorage.getItem("session-token-ttl")).toEqual(
          //   `${fifteenMinutesFromNow}`
          // );
          expect(window.localStorage.getItem("session-token")).toEqual(
            "new-session"
          );
          expect(window.localStorage.getItem("refresh-token")).toEqual(
            "new-refresh"
          );
        });
      });

      describe("when refresh request is sucessful fails", () => {
        it("rejects with error and clears storage", async () => {
          expect.assertions(4);
          const axiosError = { error: "anyError" };
          mockedAxios.request.mockRejectedValueOnce(axiosError);

          await expect(getFreshSessionToken()).rejects.toEqual(axiosError);
          expect(window.localStorage.getItem("session-token-ttl")).toBeNull();
          expect(window.localStorage.getItem("session-token")).toBeNull();
          expect(window.localStorage.getItem("refresh-token")).toBeNull();
        });
      });
    });
  });
});

describe("#login", () => {
  describe("when request is successful", () => {
    it("stores and returns credentials", async () => {
      expect.assertions(4);
      // expect.assertions(6);
      const loginResponse = {
        token: {
          session: "new-session",
          refresh: "new-refresh",
        },
      } as LoginResponse;
      const axiosResponse = {
        data: loginResponse,
      };
      mockedAxios.request.mockResolvedValue(axiosResponse);
      const userCredentials = { username: "user", password: "123" };

      const result = await login(userCredentials);

      expect(result.refreshToken).toEqual("new-refresh");
      expect(result.sessionToken).toEqual("new-session");
      // TODO: freeze time so we can assert TTL
      // expect(result.sessionTTL).toEqual(fifteenMinutesFromNow);
      expect(window.localStorage.getItem("refresh-token")).toEqual(
        "new-refresh"
      );
      expect(window.localStorage.getItem("session-token")).toEqual(
        "new-session"
      );
      // expect(window.localStorage.getItem("session-token-ttl")).toEqual(
      //   fifteenMinutesFromNow
      // );
    });
  });
});

describe("#followedMangaList", () => {
  it("returns list of followed manga's chapters", async () => {
    expect.assertions(1);
    const chapterResponse = {
      data: { attributes: chapterFixture.attributes },
    } as ChapterResponse;
    const chapterList = { results: [chapterResponse] } as ChapterList;
    mockedChapterApi.getUserFollowsMangaFeed.mockResolvedValueOnce({
      data: chapterList,
    } as AxiosResponse);

    const result = await followedMangaList();

    expect(result).toEqual([
      expect.objectContaining({
        title: chapterFixture.attributes.title,
        translatedLanguage: chapterFixture.attributes.translatedLanguage,
        publishAt: chapterFixture.attributes.publishAt,
        // TODO add manga name and uploader
      }),
    ]);
  });
});
