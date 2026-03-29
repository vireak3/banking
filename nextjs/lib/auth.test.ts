import { clearStoredAuth, getStoredToken, getStoredUser, storeAuthSession } from "@/lib/auth";

describe("auth storage helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.cookie = "blueledger_token=; Path=/; Max-Age=0; SameSite=Lax";
  });

  it("stores and reads auth session values", () => {
    storeAuthSession({
      token: "token-123",
      user: {
        id: 7,
        name: "Alice Doe",
        email: "alice@example.com",
        role: "user",
      },
    });

    expect(getStoredToken()).toBe("token-123");
    expect(getStoredUser()).toMatchObject({ email: "alice@example.com", id: 7 });
  });

  it("clears auth session values", () => {
    storeAuthSession({
      token: "token-123",
      user: {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        role: "user",
      },
    });

    clearStoredAuth();

    expect(getStoredToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });
});