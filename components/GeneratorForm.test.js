import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import GeneratorForm from './GeneratorForm';

describe('GeneratorForm', () => {
  const mockOnGenerate = jest.fn();

  beforeEach(() => {
    mockOnGenerate.mockClear();
  });

  test('renders correctly with initial state', () => {
    render(<GeneratorForm onGenerate={mockOnGenerate} isGenerating={false} />);

    expect(screen.getByLabelText('GitHub Repository URL')).toHaveValue('');
    expect(screen.getByPlaceholderText('https://github.com/username/repo')).toBeInTheDocument();
    expect(screen.getByText('normal')).toHaveClass('bg-primary/20'); // Default style
    expect(screen.getByRole('button', { name: /Generate README/i })).toBeInTheDocument();
  });

  test('displays error for empty URL submission', async () => {
    render(<GeneratorForm onGenerate={mockOnGenerate} isGenerating={false} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Generate README/i }));
    });

    expect(await screen.findByText(/GitHub repository URL cannot be empty/i)).toBeInTheDocument();
    expect(mockOnGenerate).not.toHaveBeenCalled();
  });

  test('displays error for invalid URL format', async () => {
    render(<GeneratorForm onGenerate={mockOnGenerate} isGenerating={false} />);

    const urlInput = screen.getByLabelText('GitHub Repository URL');
    await act(async () => {
      fireEvent.change(urlInput, { target: { value: 'invalid-url' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Generate README/i }));
    });

    expect(await screen.findByText(/Please enter a valid GitHub repository URL/i)).toBeInTheDocument();
    expect(mockOnGenerate).not.toHaveBeenCalled();
  });

  test('calls onGenerate with correct data for valid URL submission', async () => {
    render(<GeneratorForm onGenerate={mockOnGenerate} isGenerating={false} />);

    const urlInput = screen.getByLabelText('GitHub Repository URL');
    await act(async () => {
      fireEvent.change(urlInput, { target: { value: 'https://github.com/test/repo' } });
    });

    const styleButton = screen.getByText('deep');
    await act(async () => {
      fireEvent.click(styleButton);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Generate README/i }));
    });

    expect(screen.queryByText('GitHub repository URL cannot be empty.')).not.toBeInTheDocument();
    expect(screen.queryByText('Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo).')).not.toBeInTheDocument();
    expect(mockOnGenerate).toHaveBeenCalledWith({ url: 'https://github.com/test/repo', style: 'deep', projectDetails: '' });
  });

  test('clears URL error when user types again', async () => {
    render(<GeneratorForm onGenerate={mockOnGenerate} isGenerating={false} />);

    const urlInput = screen.getByLabelText('GitHub Repository URL');
    await act(async () => {
      fireEvent.change(urlInput, { target: { value: 'invalid-url' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Generate README/i }));
    });

    expect(await screen.findByText(/Please enter a valid GitHub repository URL/i, { timeout: 1000 })).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(urlInput, { target: { value: 'https://github.com/valid/repo' } });
    });
    expect(screen.queryByText('Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo).')).not.toBeInTheDocument();
  });

  test('updates style when a style button is clicked', async () => {
    render(<GeneratorForm onGenerate={mockOnGenerate} isGenerating={false} />);

    const simpleButton = screen.getByText('simple');
    await act(async () => {
      fireEvent.click(simpleButton);
    });

    expect(simpleButton).toHaveClass('bg-primary/20');
    expect(screen.getByText('normal')).not.toHaveClass('bg-primary/20');
  });

  test('disables submit button only while generating', async () => {
    let rerender;
    await act(async () => {
        ({ rerender } = render(<GeneratorForm onGenerate={mockOnGenerate} isGenerating={false} />));
    });
    const submitButton = screen.getByRole('button', { name: /Generate README/i });

    // Enabled initially (client-side validation will guard)
    expect(submitButton.disabled).toBe(false);

    // Disabled when isGenerating is true
    await act(async () => {
        await rerender(<GeneratorForm onGenerate={mockOnGenerate} isGenerating={true} />);
    });
    expect(submitButton.disabled).toBe(true);

    // Re-enabled when generation completes
    await act(async () => {
        await rerender(<GeneratorForm onGenerate={mockOnGenerate} isGenerating={false} />);
    });
    expect(submitButton.disabled).toBe(false);
  });
});
