import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ControlsBar } from '../ControlsBar';

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

describe('ControlsBar', () => {
  it('should render', () => {
    const { container } = render(
      <TestWrapper>
        <ControlsBar />
      </TestWrapper>
    );
    expect(container).toBeTruthy();
  });

  it('should render mobile controls', () => {
    const { container } = render(
      <TestWrapper>
        <ControlsBar />
      </TestWrapper>
    );
    // Should have mobile controls (hidden on desktop)
    const mobileControls = container.querySelector('.md\\:hidden');
    expect(mobileControls).toBeInTheDocument();
  });

  it('should render desktop controls', () => {
    const { container } = render(
      <TestWrapper>
        <ControlsBar />
      </TestWrapper>
    );
    // Should have desktop controls (hidden on mobile)
    const desktopControls = container.querySelector('.hidden.md\\:block');
    expect(desktopControls).toBeInTheDocument();
  });
});

