/**
 * Approval List Page Test
 * SCR-020
 */

import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen } from '@/test/test-utils';

import { ApprovalListPage } from './ApprovalListPage';

type MockAuthState = {
  user: {
    id: number;
    name: string;
    email: string;
    position: { id: number; name: string; level: number };
  } | null;
  isAuthenticated: boolean;
};

type MockApprovalState = {
  approvals: {
    id: number;
    reportDate: string;
    status: string;
    salesperson: { id: number; name: string };
    visitCount: number;
    submittedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
  pagination: {
    currentPage: number;
    perPage: number;
    totalPages: number;
    totalCount: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  fetchApprovals: ReturnType<typeof vi.fn>;
  clearError: ReturnType<typeof vi.fn>;
};

const mockAuthStore = vi.fn<[], MockAuthState>();
const mockApprovalStore = vi.fn<[], MockApprovalState>();

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mockAuthStore() as MockAuthState,
}));

vi.mock('@/stores/approvals', () => ({
  useApprovalStore: () => mockApprovalStore() as MockApprovalState,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockApprovals = [
  {
    id: 1,
    reportDate: '2024-01-15',
    status: 'submitted',
    salesperson: { id: 2, name: 'Yamada Taro' },
    visitCount: 3,
    submittedAt: '2024-01-15T18:00:00Z',
    createdAt: '2024-01-15T17:00:00Z',
    updatedAt: '2024-01-15T18:00:00Z',
  },
  {
    id: 2,
    reportDate: '2024-01-14',
    status: 'submitted',
    salesperson: { id: 3, name: 'Sato Hanako' },
    visitCount: 2,
    submittedAt: '2024-01-14T17:30:00Z',
    createdAt: '2024-01-14T17:00:00Z',
    updatedAt: '2024-01-14T17:30:00Z',
  },
];

const mockPagination = {
  currentPage: 1,
  perPage: 20,
  totalPages: 1,
  totalCount: 2,
};

const defaultAuthState: MockAuthState = {
  user: {
    id: 1,
    name: 'Manager',
    email: 'manager@example.com',
    position: { id: 2, name: 'Manager', level: 2 },
  },
  isAuthenticated: true,
};

const defaultApprovalState: MockApprovalState = {
  approvals: mockApprovals,
  pagination: mockPagination,
  isLoading: false,
  error: null,
  fetchApprovals: vi.fn(),
  clearError: vi.fn(),
};

function renderWithRouter(
  ui: React.ReactElement,
  initialEntries = ['/approvals']
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/approvals" element={ui} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="/reports/:id" element={<div>Report Detail</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ApprovalListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStore.mockReturnValue(defaultAuthState);
    mockApprovalStore.mockReturnValue(defaultApprovalState);
  });

  describe('Access Control', () => {
    it('redirects staff (level 1) to dashboard', () => {
      mockAuthStore.mockReturnValue({
        ...defaultAuthState,
        user: {
          id: 2,
          name: 'Staff',
          email: 'staff@example.com',
          position: { id: 1, name: 'Staff', level: 1 },
        },
      });

      renderWithRouter(<ApprovalListPage />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('allows manager (level 2) to access', () => {
      renderWithRouter(<ApprovalListPage />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('allows director (level 3) to access', () => {
      mockAuthStore.mockReturnValue({
        ...defaultAuthState,
        user: {
          id: 1,
          name: 'Director',
          email: 'director@example.com',
          position: { id: 3, name: 'Director', level: 3 },
        },
      });

      renderWithRouter(<ApprovalListPage />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('redirects when user is null', () => {
      mockAuthStore.mockReturnValue({
        ...defaultAuthState,
        user: null,
      });

      renderWithRouter(<ApprovalListPage />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Page Display', () => {
    it('displays page title', () => {
      renderWithRouter(<ApprovalListPage />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('displays approval list', () => {
      renderWithRouter(<ApprovalListPage />);
      expect(screen.getByText('Yamada Taro')).toBeInTheDocument();
      expect(screen.getByText('Sato Hanako')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('displays loading indicator when loading', () => {
      mockApprovalStore.mockReturnValue({
        ...defaultApprovalState,
        isLoading: true,
        approvals: [],
      });

      renderWithRouter(<ApprovalListPage />);
      expect(screen.getByText(/loading|読み込み/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('displays message when no approvals', () => {
      mockApprovalStore.mockReturnValue({
        ...defaultApprovalState,
        approvals: [],
        pagination: { ...mockPagination, totalCount: 0 },
      });

      renderWithRouter(<ApprovalListPage />);
      expect(screen.getByText(/no|ありません/i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error message', () => {
      mockApprovalStore.mockReturnValue({
        ...defaultApprovalState,
        error: 'Error fetching data',
      });

      renderWithRouter(<ApprovalListPage />);
      expect(screen.getByText('Error fetching data')).toBeInTheDocument();
    });
  });

  describe('Initial Load', () => {
    it('calls fetchApprovals on mount', () => {
      const fetchApprovals = vi.fn();
      mockApprovalStore.mockReturnValue({
        ...defaultApprovalState,
        fetchApprovals,
      });

      renderWithRouter(<ApprovalListPage />);
      expect(fetchApprovals).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('displays pagination when multiple pages exist', () => {
      mockApprovalStore.mockReturnValue({
        ...defaultApprovalState,
        pagination: {
          currentPage: 1,
          perPage: 20,
          totalPages: 3,
          totalCount: 50,
        },
      });

      renderWithRouter(<ApprovalListPage />);
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });
  });

  describe('Detail Navigation', () => {
    it('navigates to detail page on button click', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ApprovalListPage />);

      const detailButtons = screen.getAllByRole('button', {
        name: /detail|詳細/i,
      });
      await user.click(detailButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/reports/1');
    });
  });
});
