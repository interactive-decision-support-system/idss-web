import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import ChatInput from '@/components/ChatInput';

describe('ChatInput', () => {
  it('submits trimmed text and clears input', async () => {
    const user = userEvent.setup();
    const onSendMessage = jest.fn();

    render(
      <ChatInput onSendMessage={onSendMessage} isLoading={false} modeK={2} onModeKChange={jest.fn()} />
    );

    expect(
      screen.getByText('IDA can make mistakes. Check before completing any purchases')
    ).toBeInTheDocument();

    const input = screen.getByRole('textbox');
    await user.type(input, '  hello  ');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(onSendMessage).toHaveBeenCalledTimes(1);
    expect(onSendMessage).toHaveBeenCalledWith('hello', 2);
    expect(input).toHaveValue('');
  });

  it('does not submit while loading', async () => {
    const user = userEvent.setup();
    const onSendMessage = jest.fn();

    render(
      <ChatInput onSendMessage={onSendMessage} isLoading={true} modeK={2} onModeKChange={jest.fn()} />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /send message/i }));
    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it('lets user pick a mode (k) and sends selected k', async () => {
    const user = userEvent.setup();
    const onSendMessage = jest.fn();

    function Wrapper() {
      const [modeK, setModeK] = useState<number>(2);
      return (
        <ChatInput
          onSendMessage={onSendMessage}
          isLoading={false}
          modeK={modeK}
          onModeKChange={setModeK}
        />
      );
    }

    render(<Wrapper />);

    // Tooltip exists when menu is closed (even if hidden via CSS)
    expect(screen.getByText('Choose how many questions IDA asks before recommendations.')).toBeInTheDocument();

    // Open menu, tooltip should not be rendered
    await user.click(screen.getByRole('button', { name: /^mode$/i }));
    expect(screen.queryByText('Choose how many questions IDA asks before recommendations.')).not.toBeInTheDocument();

    // Menu items use singular/plural correctly
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Nudger')).toBeInTheDocument();
    expect(screen.getByText('1 question')).toBeInTheDocument();

    // Pick Nudger (k=1)
    await user.click(screen.getByRole('menuitemradio', { name: /nudger/i }));

    // Send a message; should include k=1
    const input = screen.getByRole('textbox');
    await user.type(input, 'hi');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(onSendMessage).toHaveBeenCalledWith('hi', 1);
  });
});

