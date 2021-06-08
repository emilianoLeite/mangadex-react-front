import "@testing-library/jest-dom/extend-expect";
import { act, renderHook } from "@testing-library/react-hooks";
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

  it("allows updating the credentials", () => {
    const sessionToken = "new-session";
    const refreshToken = "new-refresh";

    const { result } = renderHook(() => useStoredCredentials());

    act(() => {
      result.current.storeCredentials({ sessionToken, refreshToken });
    });

    expect(result.current.credentials.sessionToken).toEqual(sessionToken);
    expect(result.current.credentials.refreshToken).toEqual(refreshToken);
  });
});

describe("when the credentials were not previously stored", () => {
  it("returns empty credentials", () => {
    const {
      result: {
        current: { credentials },
      },
    } = renderHook(() => useStoredCredentials());
    expect(credentials.sessionToken).toBeNull();
    expect(credentials.refreshToken).toBeNull();
  });

  it("allows setting new credentials", () => {
    const sessionToken = "new-session";
    const refreshToken = "new-refresh";

    const { result } = renderHook(() => useStoredCredentials());

    act(() => {
      result.current.storeCredentials({ sessionToken, refreshToken });
    });

    expect(result.current.credentials.sessionToken).toEqual(sessionToken);
    expect(result.current.credentials.refreshToken).toEqual(refreshToken);
  });
});
