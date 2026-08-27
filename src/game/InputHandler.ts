export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export class InputHandler {
  private state = {
    left: false,
    right: false,
    jump: false,
  };

  public getState(): InputState {
    return this.state;
  }

  public updateInput(input: Partial<InputState>): void {
    if (input.left !== undefined) this.state.left = input.left;
    if (input.right !== undefined) this.state.right = input.right;
    if (input.jump !== undefined) this.state.jump = input.jump;
  }

  public reset(): void {
    this.state = { left: false, right: false, jump: false };
  }
}
