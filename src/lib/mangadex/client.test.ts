import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { getFreshSessionToken } from "./client";
import type { RefreshTokenResponse } from "./interfaces";

const mockedAxios = axios as jest.Mocked<typeof axios>;

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

        it.skip("returns the new sessionToken and stores it", async () => {
          expect.assertions(4);
          const refreshTokenResponse = {
            token: {
              session: "new-session",
              refresh: "new-refresh",
            },
          } as RefreshTokenResponse;
          const axiosResponse = {
            data: refreshTokenResponse,
          };
          mockedAxios.post.mockResolvedValue(axiosResponse);

          const freshToken = await getFreshSessionToken();

          expect(freshToken).toEqual("new-session");
          // TODO: freeze time so we can assert TTL
          expect(window.localStorage.getItem("session-token-ttl")).toEqual(
            `${fifteenMinutesFromNow}`
          );
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
          mockedAxios.post.mockRejectedValueOnce(axiosError);

          await expect(getFreshSessionToken()).rejects.toEqual(axiosError);
          expect(window.localStorage.getItem("session-token-ttl")).toBeNull();
          expect(window.localStorage.getItem("session-token")).toBeNull();
          expect(window.localStorage.getItem("refresh-token")).toBeNull();
        });
      });
    });
  });
});
