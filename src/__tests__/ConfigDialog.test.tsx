import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfigDialog from '../renderer/components/ConfigDialog';
import { AppConfig } from '../shared/types/leads';

describe('ConfigDialog', () => {
  const mockConfig: AppConfig = {
    openai: {
      apiKey: 'sk-test123',
      model: 'gpt-4o-mini',
      temperature: 0.2
    },
    processing: {
      batchSize: 10,
      maxConcurrent: 3,
      retryAttempts: 3
    },
    scoring: {
      thresholds: {
        highValue: 80,
        qualified: 60,
        minimum: 40
      }
    }
  };

  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render configuration dialog when open', () => {
    render(
      <ConfigDialog
        open={true}
        config={mockConfig}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByLabelText(/OpenAI API Key/i)).toBeInTheDocument();
  });

  it('should display current configuration values', () => {
    render(
      <ConfigDialog
        open={true}
        config={mockConfig}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const apiKeyInput = screen.getByLabelText(/OpenAI API Key/i) as HTMLInputElement;
    expect(apiKeyInput.value).toBe('sk-test123');

    const batchSizeInput = screen.getByLabelText(/Batch Size/i) as HTMLInputElement;
    expect(batchSizeInput.value).toBe('10');

    const highValueInput = screen.getByLabelText(/High Value Threshold/i) as HTMLInputElement;
    expect(highValueInput.value).toBe('80');
  });

  it('should mask API key input', () => {
    render(
      <ConfigDialog
        open={true}
        config={mockConfig}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const apiKeyInput = screen.getByLabelText(/OpenAI API Key/i) as HTMLInputElement;
    expect(apiKeyInput.type).toBe('password');
  });

  it('should call onSave with updated config', async () => {
    const user = userEvent.setup();
    
    render(
      <ConfigDialog
        open={true}
        config={mockConfig}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const apiKeyInput = screen.getByLabelText(/OpenAI API Key/i);
    await user.clear(apiKeyInput);
    await user.type(apiKeyInput, 'sk-newkey123');

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      openai: expect.objectContaining({
        apiKey: 'sk-newkey123'
      })
    }));
  });

  it('should validate numeric inputs', async () => {
    const user = userEvent.setup();
    
    render(
      <ConfigDialog
        open={true}
        config={mockConfig}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const batchSizeInput = screen.getByLabelText(/Batch Size/i);
    await user.clear(batchSizeInput);
    await user.type(batchSizeInput, '-5');

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    // Should not save invalid values
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should validate threshold values', async () => {
    const user = userEvent.setup();
    
    render(
      <ConfigDialog
        open={true}
        config={mockConfig}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const highValueInput = screen.getByLabelText(/High Value Threshold/i);
    await user.clear(highValueInput);
    await user.type(highValueInput, '150');

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    // Should not save invalid values
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should call onClose when cancel is clicked', () => {
    render(
      <ConfigDialog
        open={true}
        config={mockConfig}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should not render when closed', () => {
    render(
      <ConfigDialog
        open={false}
        config={mockConfig}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.queryByText('Configuration')).not.toBeInTheDocument();
  });

  it('should show toggle for API key visibility', async () => {
    const user = userEvent.setup();
    
    render(
      <ConfigDialog
        open={true}
        config={mockConfig}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const apiKeyInput = screen.getByLabelText(/OpenAI API Key/i) as HTMLInputElement;
    expect(apiKeyInput.type).toBe('password');

    const toggleButton = screen.getByLabelText(/toggle password visibility/i);
    await user.click(toggleButton);

    expect(apiKeyInput.type).toBe('text');
  });
});