import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsModal from './SettingsModal';

// Mock localStorage
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('SettingsModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const defaultInitialSettings = { provider: 'openai', apiKey: '', customEndpoint: '', githubToken: '' };

  beforeEach(() => {
    localStorageMock.clear();
    mockOnClose.mockClear();
    mockOnSave.mockClear();
  });

  test('does not render when isOpen is false', () => {
    render(<SettingsModal isOpen={false} onClose={mockOnClose} onSave={mockOnSave} initialSettings={defaultInitialSettings} />);
    expect(screen.queryByText('API Settings')).not.toBeInTheDocument();
  });

  test('renders correctly when isOpen is true', async () => {
    await act(async () => {
      render(<SettingsModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} initialSettings={defaultInitialSettings} />);
    });

    expect(screen.getByText('API Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Provider')).toBeInTheDocument();
    expect(screen.getByLabelText('API Key')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub Token (Optional)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Configuration/i })).toBeInTheDocument();
  });

  test('loads default settings when initialSettings is null/undefined', async () => {
    await act(async () => {
      render(<SettingsModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} initialSettings={null} />);
    });

    expect(screen.getByDisplayValue('OpenAI (GPT-4o)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your openai API key/i)).toHaveValue('');
  });

  test('loads saved settings correctly from initialSettings prop', async () => {
    const savedSettings = {
      provider: 'openrouter', // Changed from 'gemini'
      apiKey: 'test-api-key',
      customEndpoint: 'https://custom.endpoint',
      githubToken: 'ghp_123',
    };

    await act(async () => {
      render(<SettingsModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} initialSettings={savedSettings} />);
    });

    expect(screen.getByDisplayValue('OpenRouter')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your openrouter API key/i)).toHaveValue('test-api-key');
    expect(screen.getByDisplayValue('https://custom.endpoint')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Use a PAT to access private repos or avoid rate limits/i)).toHaveValue('ghp_123');
  });

  test('updates state on user input', async () => {
    await act(async () => {
      render(<SettingsModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} initialSettings={defaultInitialSettings} />);
    });

    const providerSelect = screen.getByLabelText('Provider');
    await act(async () => {
      fireEvent.change(providerSelect, { target: { value: 'openrouter' } });
    });
    expect(screen.getByDisplayValue('OpenRouter')).toBeInTheDocument();

    const apiKeyInput = screen.getByLabelText('API Key');
    await act(async () => {
      fireEvent.change(apiKeyInput, { target: { value: 'new-api-key' } });
    });
    expect(apiKeyInput).toHaveValue('new-api-key');

    const customEndpointInput = screen.getByLabelText('Custom Endpoint (Optional)');
    await act(async () => {
      fireEvent.change(customEndpointInput, { target: { value: 'https://new.endpoint' } });
    });
    expect(customEndpointInput).toHaveValue('https://new.endpoint');

    const githubTokenInput = screen.getByLabelText('GitHub Token (Optional)');
    await act(async () => {
      fireEvent.change(githubTokenInput, { target: { value: 'ghp_token' } });
    });
    expect(githubTokenInput).toHaveValue('ghp_token');
  });

  test('calls onSave and onClose with correct data when save button is clicked', async () => {
    await act(async () => {
      render(<SettingsModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} initialSettings={defaultInitialSettings} />);
    });

    const providerSelect = screen.getByLabelText('Provider');
    await act(async () => {
      fireEvent.change(providerSelect, { target: { value: 'gemini' } });
    });

    const apiKeyInput = screen.getByLabelText('API Key');
    await act(async () => {
      fireEvent.change(apiKeyInput, { target: { value: 'final-api-key' } });
    });

    const githubTokenInput = screen.getByLabelText('GitHub Token (Optional)');
    await act(async () => {
      fireEvent.change(githubTokenInput, { target: { value: 'ghp_final' } });
    });

    const saveButton = screen.getByRole('button', { name: /Save Configuration/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'readme_gen_settings',
      JSON.stringify({
        provider: 'gemini',
        apiKey: 'final-api-key',
        customEndpoint: '', // Default if not changed
        githubToken: 'ghp_final',
      })
    );
    expect(mockOnSave).toHaveBeenCalledWith({
      provider: 'gemini',
      apiKey: 'final-api-key',
      customEndpoint: '',
      githubToken: 'ghp_final',
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when the close button is clicked', async () => {
    await act(async () => {
      render(<SettingsModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} initialSettings={defaultInitialSettings} />);
    });

    const closeButton = screen.getByRole('button', { name: /Close settings modal/i });
    await act(async () => {
      fireEvent.click(closeButton);
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
