import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInput from '@/components/ChatInput';

describe('ChatInput', () => {
  it('submits trimmed text and clears input', async () => {
    const user = userEvent.setup();
    const onSendMessage = jest.fn();

    render(<ChatInput onSendMessage={onSendMessage} isLoading={false} />);

    const input = screen.getByRole('textbox');
    await user.type(input, '  hello  ');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(onSendMessage).toHaveBeenCalledTimes(1);
    expect(onSendMessage).toHaveBeenCalledWith('hello');
    expect(input).toHaveValue('');
  });

  it('does not submit while loading', async () => {
    const user = userEvent.setup();
    const onSendMessage = jest.fn();

    render(<ChatInput onSendMessage={onSendMessage} isLoading={true} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /send message/i }));
    expect(onSendMessage).not.toHaveBeenCalled();
  });
});

