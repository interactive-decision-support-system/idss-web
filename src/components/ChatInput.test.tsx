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
      screen.getByText('IDSS can make mistakes. Check before completing any purchases.')
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

    // Followup-question buttons: 0 questions, 1 question, 2 questions
    expect(screen.getByRole('radio', { name: /nudger.*1 question/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /explorer.*2 questions/i })).toBeInTheDocument();

    // Pick Nudger (1 question)
    await user.click(screen.getByRole('radio', { name: /nudger.*1 question/i }));

    // Send a message; should include k=1
    const input = screen.getByRole('textbox');
    await user.type(input, 'hi');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(onSendMessage).toHaveBeenCalledWith('hi', 1);
  });

  it('disables mode buttons when modeButtonsLocked is true', () => {
    render(
      <ChatInput
        onSendMessage={jest.fn()}
        isLoading={false}
        modeK={2}
        onModeKChange={jest.fn()}
        modeButtonsLocked={true}
      />
    );

    const suggester = screen.getByRole('radio', { name: /suggester.*0 questions/i });
    const nudger = screen.getByRole('radio', { name: /nudger.*1 question/i });
    const explorer = screen.getByRole('radio', { name: /explorer.*2 questions/i });

    expect(suggester).toBeDisabled();
    expect(nudger).toBeDisabled();
    expect(explorer).toBeDisabled();
  });
});

