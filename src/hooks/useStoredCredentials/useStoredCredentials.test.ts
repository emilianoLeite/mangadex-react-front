import "@testing-library/jest-dom/extend-expect";
import { renderHook } from "@testing-library/react-hooks";
import { useStoredCredentials } from "./useStoredCredentials";

describe("when the credentials were previously stored", () => {
  const sessionToken = "session-token";
  const refreshToken = "refresh-token";
  beforeEach(() => {
    window.localStorage.setItem("session-token", sessionToken);
    window.localStorage.setItem("refresh-token", refreshToken);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("returns the stored credentials", () => {
    const {
      result: {
        current: { credentials },
      },
    } = renderHook(() => useStoredCredentials());
    expect(credentials.sessionToken).toEqual(sessionToken);
    expect(credentials.refreshToken).toEqual(refreshToken);
  });
});

describe("when the credentials were not previously stored", () => {
  it("returns empty credentials", () => {
    const {
      result: {
        current: { credentials },
      },
    } = renderHook(() => useStoredCredentials());
    expect(credentials.sessionToken).toEqual(null);
    expect(credentials.refreshToken).toEqual(null);
  });
});
