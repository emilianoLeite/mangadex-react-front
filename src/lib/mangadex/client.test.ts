import "@testing-library/jest-dom/extend-expect";
import type {
  ChapterList,
  ChapterResponse,
  LoginResponse,
  RefreshResponse,
} from "mangadex-api-client";

import { followedMangaList, getFreshSessionToken, login } from "./client";
import { chapterApi } from "./ChapterApi";
import { authApi } from "./AuthApi";
import chapterFixture from "./__fixtures__/chapter";
import type { AxiosError, AxiosResponse } from "axios";

jest.mock("./ChapterApi");
const mockedChapterApi = chapterApi("mock-token") as jest.Mocked<
  ReturnType<typeof chapterApi>
>;

jest.mock("./AuthApi");
const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;

const fifteenMinutesFromNow = () => new Date().getTime() + 1000 * 60 * 15;

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
    afterEach(() => {
      window.localStorage.removeItem("session-token");
      window.localStorage.removeItem("refresh-token");
    });

    describe("when current sessionToken is still valid", () => {
      const oneHourFromNow = new Date().getTime() + 1000 * 60 * 60;

      beforeEach(() => {
        window.localStorage.setItem("session-token-ttl", `${oneHourFromNow}`);
      });
      afterEach(() => {
        window.localStorage.removeItem("session-token-ttl");
      });

      it("returns current sessionToken", async () => {
        expect.assertions(1);

        const result = await getFreshSessionToken();

        expect(result).toEqual(currentSessionToken);
      });
    });

    describe("when current sessionToken is expired, tries to refresh it", () => {
      const now = new Date().getTime();
      const oneHourAgo = now - 1000 * 60 * 60;

      beforeEach(() => {
        window.localStorage.setItem("session-token-ttl", `${oneHourAgo}`);
      });
      afterEach(() => {
        window.localStorage.removeItem("session-token-ttl");
      });

      describe("when refresh request is sucessful", () => {
        it("returns the new sessionToken and stores it", async () => {
          expect.assertions(4);
          const refreshTokenResponse = {
            token: {
              session: "new-session",
              refresh: "new-refresh",
            },
          };
          const axiosResponse = {
            data: refreshTokenResponse,
          } as AxiosResponse<RefreshResponse>;
          mockedAuthApi.postAuthRefresh.mockResolvedValue(axiosResponse);

          const freshToken = await getFreshSessionToken();

          expect(freshToken).toEqual("new-session");
          // TODO: freeze time so we can assert the exact TTL
          expect(
            parseInt(
              window.localStorage.getItem("session-token-ttl") ?? "0",
              10
            )
          ).toBeGreaterThan(now);
          expect(window.localStorage.getItem("session-token")).toEqual(
            "new-session"
          );
          expect(window.localStorage.getItem("refresh-token")).toEqual(
            "new-refresh"
          );
        });
      });

      describe("when refresh request fails", () => {
        it("rejects with error and clears storage", async () => {
          expect.assertions(4);
          const axiosError = { error: "anyError" };
          mockedAuthApi.postAuthRefresh.mockRejectedValueOnce(axiosError);

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
  describe("when supplying valid credentials", () => {
    afterEach(() => {
      window.localStorage.removeItem("session-token");
      window.localStorage.removeItem("refresh-token");
      window.localStorage.removeItem("session-token-ttl");
    });

    it("stores and returns credentials", async () => {
      expect.assertions(6);
      const now = new Date().getTime();
      const loginResponse = {
        token: {
          session: "new-session",
          refresh: "new-refresh",
        },
      } as LoginResponse;
      const axiosResponse = {
        data: loginResponse,
      } as AxiosResponse<LoginResponse>;
      mockedAuthApi.postAuthLogin.mockResolvedValue(axiosResponse);
      const userCredentials = { username: "user", password: "123" };

      const result = await login(userCredentials);

      expect(result.refreshToken).toEqual("new-refresh");
      expect(result.sessionToken).toEqual("new-session");
      // TODO: freeze time so we can assert exact TTL
      expect(result.sessionTTL).toBeGreaterThan(now);
      expect(window.localStorage.getItem("refresh-token")).toEqual(
        result.refreshToken
      );
      expect(window.localStorage.getItem("session-token")).toEqual(
        result.sessionToken
      );
      expect(
        parseInt(window.localStorage.getItem("session-token-ttl") ?? "0", 10)
      ).toEqual(result.sessionTTL);
    });
  });
  describe("when supplying invalid credentials", () => {
    it("does not store credentials and throws an error", async () => {
      expect.assertions(4);
      const axiosError = {
        response: {
          data: {
            errors: [
              {
                context: null,
                detail: "User / Password does not match",
                id: "0fd31c1e-bd06-5060-ac7c-66a2f8796e7b",
                status: 401,
                title: "unauthorized_http_exception",
              },
            ],
            result: "error",
          },
          status: 401,
        },
      } as AxiosError;
      mockedAuthApi.postAuthLogin.mockRejectedValue(axiosError);

      await expect(
        login({ username: "user", password: "123" })
      ).rejects.toEqual(axiosError);
      expect(window.localStorage.getItem("refresh-token")).toBeNull();
      expect(window.localStorage.getItem("session-token")).toBeNull();
      expect(window.localStorage.getItem("session-token-ttl")).toBeNull();
    });
  });
});

describe("#followedMangaList", () => {
  describe("when tokens were not previously persisted", () => {
    it("throws an error", async () => {
      expect.assertions(1);

      await expect(followedMangaList()).rejects.toThrow(
        "stored tokens not found"
      );
    });
  });

  describe("when tokens were previously persisted", () => {
    beforeEach(() => {
      window.localStorage.setItem("session-token", "currentSessionToken");
      window.localStorage.setItem("refresh-token", "currentRefreshToken");
      window.localStorage.setItem(
        "session-token-ttl",
        fifteenMinutesFromNow().toString()
      );
    });
    afterEach(() => {
      window.localStorage.removeItem("session-token");
      window.localStorage.removeItem("refresh-token");
      window.localStorage.removeItem("session-token-ttl");
    });

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
          // TODO add manga name
        }),
      ]);
    });
  });
});
