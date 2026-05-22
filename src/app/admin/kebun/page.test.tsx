import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import AdminKebunPage from "./page";

jest.mock("@/components/AuthGuard", () => ({
  AuthGuard: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({ token: "token-test" }),
}));

const mockKebunList = [
  { code: "KBN001", name: "Kebun Satu", luas: 12, coordinates: [] },
  { code: "KBN002", name: "Kebun Dua", luas: 14, coordinates: [] },
];

const mockDetail = {
  code: "KBN001",
  name: "Kebun Satu",
  luas: 12,
  coordinates: [],
  mandorId: null,
  supirIds: ["5"],
};

const listMock = jest.fn();
const removeMock = jest.fn();
const getDetailMock = jest.fn();
const usersMock = jest.fn();
const assignMandorMock = jest.fn();
const assignSupirMock = jest.fn();
const reassignMandorMock = jest.fn();
const reassignSupirMock = jest.fn();

jest.mock("@/api/kebunApi", () => ({
  kebunApi: {
    list: (...args: unknown[]) => listMock(...args),
    remove: (...args: unknown[]) => removeMock(...args),
    getDetail: (...args: unknown[]) => getDetailMock(...args),
    update: jest.fn(),
    create: jest.fn(),
    assignMandor: (...args: unknown[]) => assignMandorMock(...args),
    reassignMandor: (...args: unknown[]) => reassignMandorMock(...args),
    assignSupir: (...args: unknown[]) => assignSupirMock(...args),
    reassignSupir: (...args: unknown[]) => reassignSupirMock(...args),
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
    getDetailMock.mockResolvedValue(mockDetail);
    usersMock.mockResolvedValue([
      { id: 3, nama: "Mandor 3", email: "mandor3@mysawit.id", role: "MANDOR" as const },
      { id: 5, nama: "Supir 5", email: "supir5@mysawit.id", role: "SUPIR" as const },
      { id: 6, nama: "Supir 6", email: "supir6@mysawit.id", role: "SUPIR" as const },
      { id: 7, nama: "Buruh 7", email: "buruh7@mysawit.id", role: "BURUH" as const },
      { id: 1, nama: "Admin 1", email: "admin1@mysawit.id", role: "ADMIN" as const },
    ]);
    assignMandorMock.mockResolvedValue({ message: "Mandor assigned" });
    assignSupirMock.mockResolvedValue({ message: "Supir assigned" });
    reassignMandorMock.mockResolvedValue({ message: "Mandor reassigned" });
    reassignSupirMock.mockResolvedValue({ message: "Supir reassigned" });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("uses custom delete modal instead of window.confirm", async () => {
    const confirmSpy = jest.spyOn(globalThis, "confirm");
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
    expect(removeMock).toHaveBeenCalledWith("token-test", "KBN001");
  });

  it("shows only MANDOR users in mandor dropdown", async () => {
    render(<AdminKebunPage />);
    const user = userEvent.setup();

    await screen.findByText("KBN001");
    await user.click(screen.getAllByRole("button", { name: "Detail" })[0]);

    const selects = await screen.findAllByRole("combobox");
    const mandorSelect = selects[0];
    const optionLabels = within(mandorSelect)
      .getAllByRole("option")
      .map((option) => option.textContent);

    expect(optionLabels).toContain("Mandor 3 (3)");
    expect(optionLabels).not.toContain("Supir 5 (5)");
    expect(optionLabels).not.toContain("Buruh 7 (7)");
    expect(optionLabels).not.toContain("Admin 1 (1)");
  });

  it("shows only unassigned SUPIR users in assign supir dropdown", async () => {
    render(<AdminKebunPage />);
    const user = userEvent.setup();

    await screen.findByText("KBN001");
    await user.click(screen.getAllByRole("button", { name: "Detail" })[0]);

    const selects = await screen.findAllByRole("combobox");
    const assignSupirSelect = selects[1];
    const optionLabels = within(assignSupirSelect)
      .getAllByRole("option")
      .map((option) => option.textContent);

    expect(optionLabels).toContain("Supir 6 (6)");
    expect(optionLabels).not.toContain("Supir 5 (5)");
    expect(optionLabels).not.toContain("Mandor 3 (3)");
  });

  it("renders backend error message when assignment API fails", async () => {
    assignMandorMock.mockRejectedValueOnce(new Error("User 9 must have role MANDOR"));
    render(<AdminKebunPage />);
    const user = userEvent.setup();

    await screen.findByText("KBN001");
    await user.click(screen.getAllByRole("button", { name: "Detail" })[0]);

    const selects = await screen.findAllByRole("combobox");
    const mandorSelect = selects[0];
    await user.selectOptions(mandorSelect, "3");
    await user.click(screen.getByRole("button", { name: "Assign Mandor" }));

    await screen.findByText("User 9 must have role MANDOR");
  });

  it("refreshes detail state after successful mandor assignment", async () => {
    getDetailMock
      .mockResolvedValueOnce(mockDetail)
      .mockResolvedValueOnce({ ...mockDetail, mandorId: "3" });

    render(<AdminKebunPage />);
    const user = userEvent.setup();

    await screen.findByText("KBN001");
    await user.click(screen.getAllByRole("button", { name: "Detail" })[0]);

    const selects = await screen.findAllByRole("combobox");
    const mandorSelect = selects[0];
    await user.selectOptions(mandorSelect, "3");
    await user.click(screen.getByRole("button", { name: "Assign Mandor" }));

    await waitFor(() => expect(assignMandorMock).toHaveBeenCalledWith("token-test", "KBN001", "3"));
    await waitFor(() => expect(getDetailMock).toHaveBeenCalledTimes(2));
  });
});
