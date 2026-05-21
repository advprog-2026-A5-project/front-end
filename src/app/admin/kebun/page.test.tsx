import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import AdminKebunPage from "./page";

jest.mock("@/components/AuthGuard", () => ({
  AuthGuard: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({ token: "token-test" }),
}));

const mockUsers = [{ id: 1, nama: "Mandor 1", email: "mandor@example.com", role: "MANDOR" as const }];

const mockKebunList = [
  { code: "KBN001", name: "Kebun Satu", luas: 12, coordinates: [] },
  { code: "KBN002", name: "Kebun Dua", luas: 14, coordinates: [] },
];

const listMock = jest.fn();
const removeMock = jest.fn();
const getDetailMock = jest.fn();
const usersMock = jest.fn();

jest.mock("@/api/kebunApi", () => ({
  kebunApi: {
    list: (...args: unknown[]) => listMock(...args),
    remove: (...args: unknown[]) => removeMock(...args),
    getDetail: (...args: unknown[]) => getDetailMock(...args),
    update: jest.fn(),
    create: jest.fn(),
    assignMandor: jest.fn(),
    reassignMandor: jest.fn(),
    assignSupir: jest.fn(),
    reassignSupir: jest.fn(),
  },
}));

jest.mock("@/api/authApi", () => ({
  authApi: {
    users: (...args: unknown[]) => usersMock(...args),
  },
}));

describe("AdminKebunPage delete flow", () => {
  beforeEach(() => {
    listMock.mockResolvedValue([...mockKebunList]);
    removeMock.mockResolvedValue(null);
    getDetailMock.mockResolvedValue(null);
    usersMock.mockResolvedValue([...mockUsers]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("uses custom delete modal instead of window.confirm", async () => {
    const confirmSpy = jest.spyOn(window, "confirm");
    render(<AdminKebunPage />);
    const user = userEvent.setup();

    await screen.findByText("KBN001");
    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);

    expect(screen.getByText("Hapus kebun ini?")).toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("removes deleted row immediately after successful confirmation", async () => {
    render(<AdminKebunPage />);
    const user = userEvent.setup();

    await screen.findByText("KBN001");
    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    await user.click(screen.getByRole("button", { name: "Hapus" }));

    await waitFor(() => {
      expect(screen.queryByText("KBN001")).not.toBeInTheDocument();
    });
    expect(removeMock).toHaveBeenCalledWith("KBN001");
  });
});
