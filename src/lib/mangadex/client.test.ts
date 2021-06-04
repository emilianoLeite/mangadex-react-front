import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { getFreshSessionToken } from "./client";
import type { RefreshTokenResponse } from "./interfaces";

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("#getFreshSessionToken", () => {
  describe("when tokens were not previously persisted", () => {
    it("throws an error", async () => {
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
        const result = await getFreshSessionToken();

        expect(result).toEqual(currentSessionToken);
      });
    });

    describe("when current sessionToken is expired", () => {
      const oneHourAgo = new Date().getTime() - 1000 * 60 * 60;

      beforeEach(() => {
        window.localStorage.setItem("session-token-ttl", `${oneHourAgo}`);
      });

      describe("when request returns a new session token", () => {
        it("returns fresh token from request", async () => {
          const responseBody = {
            data: {
              token: { session: "new-session", refresh: "new-refresh" },
            },
          } as RefreshTokenResponse;
          mockedAxios.post.mockResolvedValue(responseBody);

          const freshToken = await getFreshSessionToken();

          expect(freshToken).toEqual("new-session");
        });
      });

      // describe("when request fails", () => {});
    });
  });
});

// path POST /auth/refresh

// request body:
//RefreshToken:
//   type: object
//   title: RefreshToken
//   additionalProperties: false
//   properties:
//     token:
//       type: string
//       minLength: 1
//   required:
//     - token

// response body
// RefreshResponse:
//   title: RefreshResponse
//   type: object
//   properties:
//     result:
//       type: string
//       enum:
//         - ok
//         - error
//     token:
//       type: object
//       properties:
//         session:
//           type: string
//         refresh:
//           type: string
//     message:
//       type: string
//   required:
//     - result

// respostas possíveis
// responses:
//         '200':
//           description: OK
//           content:
//             application/json:
//               schema:
//                 $ref: '#/components/schemas/RefreshResponse'
//         '400':
//           description: Bad Request
//           content:
//             application/json:
//               schema:
//                 $ref: '#/components/schemas/ErrorResponse'
//         '401':
//           description: Unauthorized
//           content:
//             application/json:
//               schema:
//                 $ref: '#/components/schemas/RefreshResponse'
//         '403':
//           description: Forbidden
//           content:
//             application/json:
//               schema:
//                 $ref: '#/components/schemas/RefreshResponse'
