/**
 * 顧客一覧画面のテスト
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useAuthStore } from '@/stores/auth';
import { useCustomerStore } from '@/stores/customers';

import { CustomerListPage } from './CustomerListPage';

// useNavigateをモック
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// getIndustriesをモック
vi.mock('@/lib/api/masters', () => ({
  getIndustries: vi.fn().mockResolvedValue([
    { code: '001', name: '製造業' },
    { code: '002', name: 'IT・通信' },
    { code: '003', name: '小売・流通' },
  ]),
}));

const mockCustomers = [
  {
    id: 1,
    name: '株式会社ABC',
    address: '東京都千代田区',
    phone: '03-1234-5678',
    industry: '製造業',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 2,
    name: '株式会社XYZ',
    address: '大阪府大阪市',
    phone: '06-9876-5432',
    industry: 'IT・通信',
    isActive: false,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

describe('CustomerListPage', () => {
  const mockFetchCustomers = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    // 認証ストアをリセット（担当者: level=1）
    useAuthStore.setState({
      user: {
        id: 1,
        name: '山田太郎',
        email: 'yamada@example.com',
        position: { id: 1, name: '担当', level: 1 },
      },
      accessToken: 'test-token',
      refreshToken: 'test-refresh-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    // 顧客ストアをリセット
    useCustomerStore.setState({
      customers: mockCustomers,
      pagination: {
        currentPage: 1,
        perPage: 20,
        totalPages: 1,
        totalCount: 2,
      },
      searchQuery: {},
      isLoading: false,
      error: null,
      fetchCustomers: mockFetchCustomers,
      setSearchQuery: vi.fn(),
      clearCustomers: vi.fn(),
      clearError: mockClearError,
    });

    mockNavigate.mockClear();
    mockFetchCustomers.mockClear();
    mockClearError.mockClear();
  });

  const renderCustomerListPage = () => {
    return render(
      <MemoryRouter>
        <CustomerListPage />
      </MemoryRouter>
    );
  };

  it('should render customer list page', () => {
    renderCustomerListPage();

    expect(screen.getByText('顧客マスタ一覧')).toBeInTheDocument();
    expect(screen.getByText('検索条件')).toBeInTheDocument();
    expect(screen.getByLabelText('顧客名')).toBeInTheDocument();
    expect(screen.getByLabelText('業種')).toBeInTheDocument();
    expect(screen.getByLabelText('状態')).toBeInTheDocument();
  });

  it('should call fetchCustomers on mount', () => {
    renderCustomerListPage();

    expect(mockFetchCustomers).toHaveBeenCalled();
  });

  it('should display customer list', () => {
    renderCustomerListPage();

    expect(screen.getByText('株式会社ABC')).toBeInTheDocument();
    expect(screen.getByText('株式会社XYZ')).toBeInTheDocument();
    expect(screen.getByText('製造業')).toBeInTheDocument();
    expect(screen.getByText('IT・通信')).toBeInTheDocument();
    expect(screen.getByText('03-1234-5678')).toBeInTheDocument();
  });

  it('should display result count', () => {
    renderCustomerListPage();

    expect(screen.getByText('検索結果: 2件')).toBeInTheDocument();
  });

  it('should show status badges correctly', () => {
    renderCustomerListPage();

    const badges = screen.getAllByText(/有効|無効/);
    expect(badges).toHaveLength(2);
  });

  it('should not show create button for staff (level=1)', () => {
    renderCustomerListPage();

    expect(screen.queryByText('新規登録')).not.toBeInTheDocument();
  });

  it('should not show edit button for staff (level=1)', () => {
    renderCustomerListPage();

    expect(screen.queryByText('編集')).not.toBeInTheDocument();
  });

  it('should show create button for manager (level>=2)', () => {
    // 課長として設定
    useAuthStore.setState({
      user: {
        id: 2,
        name: '鈴木課長',
        email: 'suzuki@example.com',
        position: { id: 2, name: '課長', level: 2 },
      },
    });

    renderCustomerListPage();

    expect(screen.getByText('新規登録')).toBeInTheDocument();
  });

  it('should show edit button for manager (level>=2)', () => {
    // 課長として設定
    useAuthStore.setState({
      user: {
        id: 2,
        name: '鈴木課長',
        email: 'suzuki@example.com',
        position: { id: 2, name: '課長', level: 2 },
      },
    });

    renderCustomerListPage();

    const editButtons = screen.getAllByText('編集');
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('should navigate to create page when create button is clicked', async () => {
    const user = userEvent.setup();

    // 課長として設定
    useAuthStore.setState({
      user: {
        id: 2,
        name: '鈴木課長',
        email: 'suzuki@example.com',
        position: { id: 2, name: '課長', level: 2 },
      },
    });

    renderCustomerListPage();

    const createButton = screen.getByText('新規登録');
    await user.click(createButton);

    expect(mockNavigate).toHaveBeenCalledWith('/customers/new');
  });

  it('should navigate to edit page when edit button is clicked', async () => {
    const user = userEvent.setup();

    // 課長として設定
    useAuthStore.setState({
      user: {
        id: 2,
        name: '鈴木課長',
        email: 'suzuki@example.com',
        position: { id: 2, name: '課長', level: 2 },
      },
    });

    renderCustomerListPage();

    const editButtons = screen.getAllByText('編集');
    expect(editButtons.length).toBeGreaterThan(0);
    await user.click(editButtons[0]!);

    expect(mockNavigate).toHaveBeenCalledWith('/customers/1/edit');
  });

  it('should search customers when search button is clicked', async () => {
    const user = userEvent.setup();
    renderCustomerListPage();

    const nameInput = screen.getByLabelText('顧客名');
    await user.type(nameInput, 'ABC');

    const searchButton = screen.getByText('検索');
    await user.click(searchButton);

    expect(mockClearError).toHaveBeenCalled();
    expect(mockFetchCustomers).toHaveBeenCalledWith({
      page: 1,
      name: 'ABC',
    });
  });

  it('should clear search when clear button is clicked', async () => {
    const user = userEvent.setup();
    renderCustomerListPage();

    const nameInput = screen.getByLabelText('顧客名');
    await user.type(nameInput, 'ABC');

    const clearButton = screen.getByText('クリア');
    await user.click(clearButton);

    expect(mockClearError).toHaveBeenCalled();
    expect(mockFetchCustomers).toHaveBeenCalledWith({ page: 1 });
  });

  it('should show loading state', () => {
    useCustomerStore.setState({
      isLoading: true,
      customers: [],
    });

    renderCustomerListPage();

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('should show empty message when no customers', () => {
    useCustomerStore.setState({
      isLoading: false,
      customers: [],
      pagination: {
        currentPage: 1,
        perPage: 20,
        totalPages: 0,
        totalCount: 0,
      },
    });

    renderCustomerListPage();

    expect(screen.getByText('顧客がありません')).toBeInTheDocument();
  });

  it('should display error message', () => {
    useCustomerStore.setState({
      error: 'データの取得に失敗しました',
    });

    renderCustomerListPage();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'データの取得に失敗しました'
    );
  });

  it('should show pagination when totalPages > 1', () => {
    useCustomerStore.setState({
      pagination: {
        currentPage: 1,
        perPage: 20,
        totalPages: 3,
        totalCount: 50,
      },
    });

    renderCustomerListPage();

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByText(/前へ/)).toBeInTheDocument();
    expect(screen.getByText(/次へ/)).toBeInTheDocument();
  });

  it('should handle page change', async () => {
    const user = userEvent.setup();

    useCustomerStore.setState({
      pagination: {
        currentPage: 1,
        perPage: 20,
        totalPages: 3,
        totalCount: 50,
      },
    });

    renderCustomerListPage();

    const nextButton = screen.getByText(/次へ/);
    await user.click(nextButton);

    expect(mockFetchCustomers).toHaveBeenCalledWith({ page: 2 });
  });

  it('should disable previous button on first page', () => {
    useCustomerStore.setState({
      pagination: {
        currentPage: 1,
        perPage: 20,
        totalPages: 3,
        totalCount: 50,
      },
    });

    renderCustomerListPage();

    const prevButton = screen.getByText(/前へ/);
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button on last page', () => {
    useCustomerStore.setState({
      pagination: {
        currentPage: 3,
        perPage: 20,
        totalPages: 3,
        totalCount: 50,
      },
    });

    renderCustomerListPage();

    const nextButton = screen.getByText(/次へ/);
    expect(nextButton).toBeDisabled();
  });

  it('should filter by industry', async () => {
    const user = userEvent.setup();
    renderCustomerListPage();

    // Wait for industries to load
    await waitFor(() => {
      const industrySelect = screen.getByLabelText('業種');
      expect(industrySelect).toBeInTheDocument();
    });

    const industrySelect = screen.getByLabelText('業種');
    await user.selectOptions(industrySelect, '製造業');

    const searchButton = screen.getByText('検索');
    await user.click(searchButton);

    expect(mockFetchCustomers).toHaveBeenCalledWith({
      page: 1,
      industry: '製造業',
    });
  });

  it('should filter by status', async () => {
    const user = userEvent.setup();
    renderCustomerListPage();

    const statusSelect = screen.getByLabelText('状態');
    await user.selectOptions(statusSelect, 'true');

    const searchButton = screen.getByText('検索');
    await user.click(searchButton);

    expect(mockFetchCustomers).toHaveBeenCalledWith({
      page: 1,
      is_active: true,
    });
  });
});
