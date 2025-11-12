import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageSwitcher } from '../LanguageSwitcher';

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('LanguageSwitcher', () => {
  it('should render', () => {
    const { container } = render(
      <TestWrapper>
        <LanguageSwitcher />
      </TestWrapper>
    );
    expect(container).toBeTruthy();
  });

  it('should render with mobile prop', () => {
    const { container } = render(
      <TestWrapper>
        <LanguageSwitcher mobile />
      </TestWrapper>
    );
    expect(container).toBeTruthy();
  });
});

